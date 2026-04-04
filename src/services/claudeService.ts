/**
 * Claude API Service Layer — all Claude API calls live here.
 * Owner: Developer 2 (Claude API Service)
 */
import type { ScoreResult } from '../types/index';

export async function scoreAnswers(
  question: string,
  answerA: string,
  answerB: string
): Promise<ScoreResult> {
  const prompt =
    'You are an expert educational assessor. Two students answered the same question.\n\n' +
    'Question: ' + question + '\n' +
    'Student A answer: ' + answerA + '\n' +
    'Student B answer: ' + answerB + '\n\n' +
    'Return ONLY valid JSON, no extra text, no markdown:\n' +
    '{\n' +
    '  student_a: { correctness: 0-10, reasoning_depth: 0-10, clarity: 0-10, total: 0-100, misconception_present: true/false, misconception_name: string or null, concept_gap: string or null },\n' +
    '  student_b: { correctness: 0-10, reasoning_depth: 0-10, clarity: 0-10, total: 0-100, misconception_present: true/false, misconception_name: string or null, concept_gap: string or null },\n' +
    '  depth_insight: one sentence comparing what A explained vs what B explained,\n' +
    '  same_answer_different_depth: true/false,\n' +
    '  winner: A or B or tie\n' +
    '}';

  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text: string = data.content[0].text;

    // Strip any ```json or ``` fences
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed: ScoreResult = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Claude API';
    throw new Error(message);
  }
}
