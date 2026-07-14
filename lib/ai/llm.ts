/**
 * Shared LLM JSON completion: Gemini → Groq → null.
 * Never throws for missing keys; callers fall back to heuristics.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export type LlmSource = 'gemini' | 'groq' | 'none';

export type LlmJsonResult<T> = {
  data: T;
  source: Exclude<LlmSource, 'none'>;
} | null;

function preferredProvider(): 'auto' | 'gemini' | 'groq' {
  const p = (process.env.AI_PROVIDER || 'auto').toLowerCase().trim();
  if (p === 'gemini' || p === 'groq') return p;
  return 'auto';
}

function extractJsonObject(text: string): unknown | null {
  if (!text) return null;
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    /* try substring */
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

async function completeWithGemini(system: string, user: string): Promise<string | null> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const prompt = `${system}\n\nUSER:\n${user}\n\nRespond with valid JSON only, no markdown.`;
    const result = await model.generateContent(prompt);
    return result.response.text() || null;
  } catch (err) {
    console.warn('[llm] Gemini failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function completeWithGroq(system: string, user: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[llm] Groq HTTP', res.status, errText.slice(0, 200));
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn('[llm] Groq failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Ask the model for JSON. Returns parsed object + provider, or null.
 */
export async function completeJson<T extends Record<string, unknown>>(
  system: string,
  user: string
): Promise<LlmJsonResult<T>> {
  const order = preferredProvider();

  const tryGemini = async (): Promise<LlmJsonResult<T>> => {
    const text = await completeWithGemini(system, user);
    if (!text) return null;
    const parsed = extractJsonObject(text);
    if (!parsed || typeof parsed !== 'object') return null;
    return { data: parsed as T, source: 'gemini' };
  };

  const tryGroq = async (): Promise<LlmJsonResult<T>> => {
    const text = await completeWithGroq(system, user);
    if (!text) return null;
    const parsed = extractJsonObject(text);
    if (!parsed || typeof parsed !== 'object') return null;
    return { data: parsed as T, source: 'groq' };
  };

  if (order === 'gemini') {
    return (await tryGemini()) || (await tryGroq());
  }
  if (order === 'groq') {
    return (await tryGroq()) || (await tryGemini());
  }

  // auto: Gemini first, then Groq
  return (await tryGemini()) || (await tryGroq());
}

export function hasAnyLlmKey(): boolean {
  return Boolean(process.env.GOOGLE_GEMINI_API_KEY || process.env.GROQ_API_KEY);
}
