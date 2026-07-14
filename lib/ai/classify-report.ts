/**
 * Classify a civic report: category, severity, department, priority_score.
 * LLM (Gemini/Groq) with heuristic merge fallback.
 */

import { completeJson } from '@/lib/ai/llm';
import {
  buildReportPriorityMeta,
  computePriorityScore,
  normalizeSeverity,
  resolveDepartment,
  type SeverityLevel,
} from '@/lib/reports/priority';
import { normalizeCategory } from '@/lib/gemini/classify';
import { normalizeDepartment } from '@/lib/reports/departments';
import {
  severityFromCommunity,
  inferIssueScope,
  communityPriorityBonus,
} from '@/lib/reports/community-severity';

export type ClassifyResult = {
  category: string;
  severity: SeverityLevel;
  department: string;
  priority_score: number;
  rationale: string;
  confidence: number;
  source: 'gemini' | 'groq' | 'heuristic';
};

type LlmClassify = {
  category?: string;
  severity?: string;
  department?: string;
  priority_score?: number;
  rationale?: string;
  confidence?: number;
};

const SYSTEM = `You are a municipal civic-issue classifier for Punjab, India.
Return JSON only with keys:
- category: one of Road, Garbage, Water, Electricity, Environment, Other
- severity: one of Low, Medium, High, Critical
- department: short municipal department name
- priority_score: integer 0-100
- rationale: one short sentence
- confidence: number 0-1

Rules:
- Life safety (live wire, open manhole, flood, fire, collapse) => Critical (90-100)
- School zones, major traffic hazards, sewage overflow => High (70-89)
- Routine maintenance, minor inconvenience => Low/Medium
- Map Road->PWD (Roads), Garbage->Municipal Sanitation, Water->Water & Sewerage Board, Electricity->Electricity Department, Environment->Parks & Environment`;

export async function classifyReport(input: {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  severity?: string | null;
  location?: string | null;
  upvotes?: number | null;
}): Promise<ClassifyResult> {
  const heuristic = buildReportPriorityMeta({
    title: input.title,
    description: input.description,
    category: input.category || normalizeCategory(`${input.title} ${input.description}`),
    severity: input.severity,
    upvotes: input.upvotes,
  });

  const scope = inferIssueScope({
    title: input.title,
    description: input.description,
    location: input.location,
    category: heuristic.category,
  });

  const community = severityFromCommunity({
    baseSeverity: heuristic.severity,
    upvotes: input.upvotes || 0,
    scope,
    title: input.title,
    description: input.description,
    location: input.location,
    category: heuristic.category,
  });

  const baseScore = Math.min(
    100,
    heuristic.priority_score + communityPriorityBonus(input.upvotes || 0, scope)
  );

  const base: ClassifyResult = {
    category: heuristic.category,
    severity: community.severity,
    department: heuristic.department,
    priority_score: baseScore,
    rationale: `${community.reason} Department: ${heuristic.department}.`,
    confidence: 0.55,
    source: 'heuristic',
  };

  const user = JSON.stringify({
    title: input.title || '',
    description: input.description || '',
    category_hint: input.category || null,
    severity_hint: input.severity || null,
    location: input.location || null,
    upvotes: input.upvotes || 0,
    issue_scope: scope,
    note: 'Severity should reflect risk AND local community concern (upvotes). Broader (state) issues need more local support to escalate.',
  });

  const llm = await completeJson<LlmClassify>(SYSTEM, user);
  if (!llm) return base;

  const category = normalizeCategory(llm.data.category || heuristic.category);
  let severity = normalizeSeverity(llm.data.severity || community.severity);
  // Community can still escalate above LLM
  const merged = severityFromCommunity({
    baseSeverity: severity,
    upvotes: input.upvotes || 0,
    scope,
    title: input.title,
    description: input.description,
    location: input.location,
    category,
  });
  severity = merged.severity;

  const department = normalizeDepartment(
    (typeof llm.data.department === 'string' && llm.data.department.trim()) ||
      resolveDepartment(category)
  );

  let priority_score =
    typeof llm.data.priority_score === 'number' && Number.isFinite(llm.data.priority_score)
      ? Math.round(llm.data.priority_score)
      : computePriorityScore({
          severity,
          category,
          title: input.title,
          description: input.description,
          upvotes: input.upvotes,
        });
  priority_score = Math.max(
    0,
    Math.min(100, priority_score + communityPriorityBonus(input.upvotes || 0, scope))
  );

  const confidence =
    typeof llm.data.confidence === 'number'
      ? Math.max(0, Math.min(1, llm.data.confidence))
      : 0.8;

  return {
    category,
    severity,
    department,
    priority_score,
    rationale:
      (typeof llm.data.rationale === 'string' && llm.data.rationale.trim()) ||
      merged.reason,
    confidence,
    source: llm.source,
  };
}
