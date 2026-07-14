export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, isAuthFailure } from '@/lib/auth';
import { completeJson, hasAnyLlmKey } from '@/lib/ai/llm';
import { classifyReport } from '@/lib/ai/classify-report';

/**
 * Diagnose AI keys + end-to-end classify (for authority setup).
 * GET /api/ai/health
 */
export async function GET() {
  const auth = await requireUser();
  if (isAuthFailure(auth)) return auth.error;

  const geminiKey = Boolean(process.env.GOOGLE_GEMINI_API_KEY?.trim());
  const groqKey = Boolean(process.env.GROQ_API_KEY?.trim());
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();

  let llmProbe: {
    ok: boolean;
    source: string | null;
    error?: string;
    sample?: unknown;
  } = { ok: false, source: null };

  if (hasAnyLlmKey()) {
    try {
      const result = await completeJson<{ ping?: string }>(
        'Return JSON only: {"ping":"ok"}',
        'health check'
      );
      if (result) {
        llmProbe = { ok: true, source: result.source, sample: result.data };
      } else {
        llmProbe = {
          ok: false,
          source: null,
          error:
            'Keys present but model returned no parseable JSON. Check model name / quota / billing.',
        };
      }
    } catch (e) {
      llmProbe = {
        ok: false,
        source: null,
        error: e instanceof Error ? e.message : 'probe failed',
      };
    }
  } else {
    llmProbe = {
      ok: false,
      source: null,
      error: 'No GOOGLE_GEMINI_API_KEY or GROQ_API_KEY in server environment',
    };
  }

  // Heuristic classify always works
  const heuristic = await classifyReport({
    title: 'Open manhole on sector road',
    description: 'Missing cover, children walk here, urgent hazard near school',
    category: 'Road',
    location: 'Sector 17, Chandigarh, Punjab',
  });

  return NextResponse.json({
    ok: llmProbe.ok || heuristic.source === 'heuristic',
    keys: {
      gemini: geminiKey,
      groq: groqKey,
      any: hasAnyLlmKey(),
      provider,
    },
    llm: llmProbe,
    classify_sample: {
      severity: heuristic.severity,
      department: heuristic.department,
      priority_score: heuristic.priority_score,
      source: heuristic.source,
      rationale: heuristic.rationale,
    },
    note: llmProbe.ok
      ? 'LLM is working. Authority auto-fill will use AI + heuristics.'
      : 'LLM not available. Authority auto-fill still works via heuristics (severity/department/task-force match). Add GOOGLE_GEMINI_API_KEY or GROQ_API_KEY on Vercel for real AI.',
  });
}
