/**
 * Suggest task-force assignment + auto fields for authority approval.
 */

import { completeJson } from '@/lib/ai/llm';
import { classifyReport, type ClassifyResult } from '@/lib/ai/classify-report';

export type TaskForceCandidate = {
  id: string;
  name: string;
  status?: string;
  issueCount?: number;
  progress?: number;
};

export type AssignmentSuggestion = ClassifyResult & {
  recommended_task_force_id: string | null;
  recommended_task_force_name: string | null;
  recommended_status: 'Under Review' | 'In Progress' | 'Submitted';
  load_note: string;
};

const KEYWORDS: Record<string, string[]> = {
  Road: ['road', 'pwd', 'pothole', 'street', 'highway', 'traffic'],
  Garbage: ['garbage', 'waste', 'sanitation', 'clean', 'solid'],
  Water: ['water', 'sewage', 'sewer', 'drain', 'pipeline'],
  Electricity: ['electric', 'power', 'light', 'grid', 'transformer'],
  Environment: ['park', 'tree', 'environment', 'green'],
  Other: ['general', 'misc', 'civic'],
};

function scoreTaskForce(
  tf: TaskForceCandidate,
  category: string,
  severity: string
): number {
  const name = (tf.name || '').toLowerCase();
  const keys = KEYWORDS[category] || KEYWORDS.Other;
  let score = 0;
  for (const k of keys) {
    if (name.includes(k)) score += 10;
  }
  // Prefer lighter load
  const load = typeof tf.issueCount === 'number' ? tf.issueCount : 0;
  score += Math.max(0, 12 - load);

  // Critical prefers less loaded even more
  if (severity === 'Critical' || severity === 'High') {
    score += Math.max(0, 8 - load);
  }

  // Prefer higher progress (more effective unit)
  if (typeof tf.progress === 'number') {
    score += Math.round(tf.progress / 25);
  }

  if ((tf.status || 'active') !== 'active') score -= 50;
  return score;
}

function pickHeuristicTaskForce(
  classification: ClassifyResult,
  taskForces: TaskForceCandidate[]
): { id: string | null; name: string | null; load_note: string } {
  const active = taskForces.filter((t) => (t.status || 'active') === 'active');
  if (active.length === 0) {
    return {
      id: null,
      name: null,
      load_note: 'No active task forces available. Create one, then assign.',
    };
  }

  const ranked = [...active]
    .map((tf) => ({
      tf,
      score: scoreTaskForce(tf, classification.category, classification.severity),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 5) {
    // Still pick lightest load
    const lightest = [...active].sort(
      (a, b) => (a.issueCount || 0) - (b.issueCount || 0)
    )[0];
    return {
      id: lightest.id,
      name: lightest.name,
      load_note: `No specialty match — recommending least-loaded unit “${lightest.name}” (${lightest.issueCount ?? 0} issues).`,
    };
  }

  return {
    id: best.tf.id,
    name: best.tf.name,
    load_note: `Best match “${best.tf.name}” for ${classification.category} · ${best.tf.issueCount ?? 0} open · ${best.tf.progress ?? 0}% resolved.`,
  };
}

type LlmAssign = {
  recommended_task_force_id?: string | null;
  recommended_status?: string;
  rationale?: string;
  load_note?: string;
  severity?: string;
  department?: string;
  priority_score?: number;
  category?: string;
  confidence?: number;
};

export async function suggestAssignment(input: {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  severity?: string | null;
  location?: string | null;
  department?: string | null;
  current_status?: string | null;
  upvotes?: number | null;
  taskForces: TaskForceCandidate[];
}): Promise<AssignmentSuggestion> {
  const classification = await classifyReport({
    title: input.title,
    description: input.description,
    category: input.category,
    severity: input.severity,
    location: input.location,
    upvotes: input.upvotes,
  });

  // Prefer existing department if set and sensible
  if (input.department && input.department.trim()) {
    classification.department = input.department.trim();
  }

  const heuristicPick = pickHeuristicTaskForce(classification, input.taskForces);
  const activeIds = new Set(
    input.taskForces.filter((t) => (t.status || 'active') === 'active').map((t) => t.id)
  );

  const tfList = input.taskForces
    .filter((t) => (t.status || 'active') === 'active')
    .map((t) => ({
      id: t.id,
      name: t.name,
      issueCount: t.issueCount ?? 0,
      progress: t.progress ?? 0,
    }));

  const system = `You assign civic reports to municipal task forces in Punjab.
Return JSON only:
{
  "recommended_task_force_id": string | null,
  "recommended_status": "Under Review" | "In Progress",
  "severity": "Low"|"Medium"|"High"|"Critical",
  "department": string,
  "priority_score": number,
  "category": string,
  "rationale": string,
  "load_note": string,
  "confidence": number
}
Rules:
- recommended_task_force_id MUST be one of the provided task force ids, or null if none fit.
- Prefer specialty match (name keywords) then lowest issueCount.
- Critical issues: prefer lighter-loaded forces.
- recommended_status is usually "Under Review" when first assigning.`;

  const user = JSON.stringify({
    report: {
      title: input.title,
      description: input.description,
      category: classification.category,
      severity: classification.severity,
      department: classification.department,
      location: input.location,
      current_status: input.current_status,
    },
    task_forces: tfList,
  });

  const llm = await completeJson<LlmAssign>(system, user);

  let tfId = heuristicPick.id;
  let tfName = heuristicPick.name;
  let load_note = heuristicPick.load_note;
  let rationale = classification.rationale;
  let source = classification.source;
  let confidence = classification.confidence;
  let recommended_status: AssignmentSuggestion['recommended_status'] = 'Under Review';

  if (llm) {
    source = llm.source;
    const candidate = llm.data.recommended_task_force_id;
    if (typeof candidate === 'string' && activeIds.has(candidate)) {
      tfId = candidate;
      const found = input.taskForces.find((t) => t.id === candidate);
      tfName = found?.name || null;
    } else if (candidate === null) {
      // model said null — keep heuristic unless list empty
    }
    if (typeof llm.data.load_note === 'string' && llm.data.load_note.trim()) {
      load_note = llm.data.load_note.trim();
    }
    if (typeof llm.data.rationale === 'string' && llm.data.rationale.trim()) {
      rationale = llm.data.rationale.trim();
    }
    if (typeof llm.data.confidence === 'number') {
      confidence = Math.max(0, Math.min(1, llm.data.confidence));
    }
    if (llm.data.recommended_status === 'In Progress') {
      recommended_status = 'In Progress';
    }
    if (typeof llm.data.department === 'string' && llm.data.department.trim()) {
      classification.department = llm.data.department.trim();
    }
    if (typeof llm.data.priority_score === 'number') {
      classification.priority_score = Math.max(
        0,
        Math.min(100, Math.round(llm.data.priority_score))
      );
    }
  }

  // Terminal statuses shouldn't be forced back
  const cur = (input.current_status || '').toLowerCase();
  if (cur === 'resolved' || cur === 'rejected') {
    recommended_status = 'Submitted';
  }

  return {
    ...classification,
    source,
    confidence,
    rationale,
    recommended_task_force_id: tfId,
    recommended_task_force_name: tfName,
    recommended_status:
      recommended_status === 'Submitted' ? 'Under Review' : recommended_status,
    load_note,
  };
}
