/**
 * Claude API Service Layer — all Claude API calls live here.
 * Owner: Developer 2 (Claude API Service)
 */
import type { ScheduleResponse } from '../types';
import type { ScoreResult } from '../types/index';
import type { StudySnapshot, GeneratedReport } from '../types/report';

const CLAUDE_URL = '/anthropic/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string {
  return import.meta.env.VITE_CLAUDE_API_KEY as string;
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
    'anthropic-version': '2023-06-01',
  };
}

function stripFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

// ── scoreAnswers ─────────────────────────────────────────────────────────────
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
    '  "student_a": { "correctness": 0-10, "reasoning_depth": 0-10, "clarity": 0-10, "total": 0-100, "misconception_present": true, "misconception_name": null, "concept_gap": null },\n' +
    '  "student_b": { "correctness": 0-10, "reasoning_depth": 0-10, "clarity": 0-10, "total": 0-100, "misconception_present": true, "misconception_name": null, "concept_gap": null },\n' +
    '  "depth_insight": "one sentence",\n' +
    '  "same_answer_different_depth": true,\n' +
    '  "winner": "A"\n' +
    '}';

  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  return JSON.parse(stripFences(data.content[0].text)) as ScoreResult;
}

// ── generateFollowUp ─────────────────────────────────────────────────────────
export const generateFollowUp = async (
  _question: string,
  _answer: string,
  _depthScore: number,
) => {
  // Implementation
};

// ── detectMisconception ──────────────────────────────────────────────────────
export const detectMisconception = async (_question: string, _answer: string) => {
  // Implementation
};

// ── calibrateConfidence ──────────────────────────────────────────────────────
export const calibrateConfidence = async (
  _question: string,
  _answer: string,
  _confidenceRating: number,
  _depthScore: number,
) => {
  // Implementation
};

// ── generateQuestion ─────────────────────────────────────────────────────────
export const generateQuestion = async (_topic: string) => {
  // Implementation
};

// ── generateSchedule ─────────────────────────────────────────────────────────
export const generateSchedule = async (
  gaps: string[],
  avgScore: number,
  daysToExam: number = 7,
): Promise<ScheduleResponse> => {
  const apiKey = getApiKey();

  const prompt = `You are an adaptive learning coach for college students.

The student has these concept gaps identified from recent sessions:
Gaps: ${JSON.stringify(gaps)}
Average understanding score: ${avgScore}/100
Days until exam: ${daysToExam}

Generate a 3-day study schedule that targets these gaps.
Return ONLY valid JSON, no extra text:
{
  "schedule": [
    {
      "day": "Today · Monday",
      "sessions": [
        {
          "time": "9:00 am",
          "label": "session name",
          "topic_tag": "gap focus",
          "duration": "30 min",
          "badge_type": "coral",
          "targets_gap": "which gap this addresses or null"
        }
      ]
    }
  ],
  "priority_gap": "the most urgent gap to close",
  "readiness_message": "one sentence on exam readiness"
}`;

  if (!apiKey) return buildMockSchedule(gaps);

  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  try {
    return JSON.parse(stripFences(data.content[0].text)) as ScheduleResponse;
  } catch {
    throw new Error('Claude returned invalid JSON. Try regenerating.');
  }
};

// ── generateReport ───────────────────────────────────────────────────────────
export const generateReport = async (snapshot: StudySnapshot): Promise<GeneratedReport> => {
  const apiKey = getApiKey();

  const avgScore =
    snapshot.quizSessions.length === 0
      ? 0
      : Math.round(snapshot.quizSessions.reduce((s, q) => s + q.scoreA, 0) / snapshot.quizSessions.length);

  const adherencePct =
    snapshot.scheduleAdherence.sessionsPlanned === 0
      ? 0
      : Math.round((snapshot.scheduleAdherence.sessionsCompleted / snapshot.scheduleAdherence.sessionsPlanned) * 100);

  const userPrompt = `Generate a comprehensive study performance report based on this data:

QUIZ PERFORMANCE:
Sessions completed: ${snapshot.quizSessions.length}
Average score: ${avgScore}/100
Concept gaps detected: ${snapshot.quizSessions.flatMap((q) => q.conceptGaps).join(', ') || 'None'}
Misconceptions identified: ${snapshot.quizSessions.flatMap((q) => q.misconceptions).join(', ') || 'None'}
Depth insights: ${snapshot.quizSessions.map((q) => q.depthInsight).join('; ') || 'Not yet assessed'}

STUDY SCHEDULE:
Sessions planned: ${snapshot.scheduleAdherence.sessionsPlanned}
Sessions completed: ${snapshot.scheduleAdherence.sessionsCompleted}
Adherence rate: ${adherencePct}%
Priority gap being targeted: ${snapshot.scheduleAdherence.priorityGap}

EXAM READINESS:
Overall readiness score: ${snapshot.examReadiness.overallScore}/100
Topic coverage: ${JSON.stringify(snapshot.examReadiness.topicCoverage)}
Weak areas: ${snapshot.examReadiness.weakAreas.join(', ') || 'None identified'}
Cross-examinations passed: ${snapshot.examReadiness.crossExamsPassed}
Cross-examinations failed: ${snapshot.examReadiness.crossExamsFailed}

Return this exact JSON structure:
{
  "overallScore": 62,
  "topStrength": "one sentence",
  "topWeakness": "one sentence",
  "sections": [
    { "title": "Reasoning Quality", "score": 58, "summary": "2-3 sentences", "keyFindings": ["f1","f2","f3"], "recommendation": "one step" },
    { "title": "Study Consistency", "score": 65, "summary": "2-3 sentences", "keyFindings": ["f1","f2"], "recommendation": "one step" },
    { "title": "Exam Readiness", "score": 55, "summary": "2-3 sentences", "keyFindings": ["f1","f2","f3"], "recommendation": "one step" },
    { "title": "Concept Mastery", "score": 60, "summary": "2-3 sentences", "keyFindings": ["f1","f2"], "recommendation": "one step" }
  ],
  "actionPlan": ["Immediate action (next 24 hours): step", "This week: step", "Before exam: step"],
  "predictedExamScore": 64,
  "confidenceCalibration": "well-calibrated"
}`;

  if (!apiKey) return buildMockReport(snapshot);

  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: 'You are an expert academic performance analyst. Return ONLY valid JSON, no markdown, no backticks.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  try {
    return JSON.parse(stripFences(data.content[0].text)) as GeneratedReport;
  } catch {
    throw new Error('Claude returned invalid JSON for the report. Try again.');
  }
};

// ── Mock fallbacks ────────────────────────────────────────────────────────────
function buildMockSchedule(gaps: string[]): ScheduleResponse {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  const gapSessions = gaps.slice(0, 2).map((gap, i) => ({
    time: i === 0 ? '9:00 am' : '11:00 am',
    label: `Deep dive: ${gap}`,
    topic_tag: gap,
    duration: '45 min',
    badge_type: 'coral' as const,
    targets_gap: gap,
  }));
  return {
    schedule: [
      {
        day: `Today · ${today}`,
        sessions: [...gapSessions, { time: '2:00 pm', label: 'Reasoning challenge practice', topic_tag: 'challenge', duration: '30 min', badge_type: 'purple', targets_gap: null }],
      },
      {
        day: 'Wednesday',
        sessions: [
          gaps[0]
            ? { time: '10:00 am', label: `Reinforce: ${gaps[0]}`, topic_tag: gaps[0], duration: '40 min', badge_type: 'coral' as const, targets_gap: gaps[0] }
            : { time: '10:00 am', label: 'Concept mapping', topic_tag: 'review', duration: '40 min', badge_type: 'teal' as const, targets_gap: null },
          { time: '1:00 pm', label: 'Mixed practice quiz', topic_tag: 'challenge', duration: '30 min', badge_type: 'purple', targets_gap: null },
        ],
      },
      {
        day: 'Friday',
        sessions: [
          gaps[1]
            ? { time: '9:00 am', label: `Master: ${gaps[1]}`, topic_tag: gaps[1], duration: '45 min', badge_type: 'coral' as const, targets_gap: gaps[1] }
            : { time: '9:00 am', label: 'Full concept review', topic_tag: 'review', duration: '45 min', badge_type: 'teal' as const, targets_gap: null },
          { time: '12:00 pm', label: 'Exam simulation', topic_tag: 'challenge', duration: '60 min', badge_type: 'purple', targets_gap: null },
        ],
      },
    ],
    priority_gap: gaps[0] ?? 'General review',
    readiness_message: gaps.length > 0
      ? `Focus on closing ${gaps.length} identified gap${gaps.length > 1 ? 's' : ''} before the exam.`
      : 'You are on track — keep up the practice sessions.',
  };
}

function buildMockReport(snapshot: StudySnapshot): GeneratedReport {
  const gaps = snapshot.quizSessions.flatMap((q) => q.conceptGaps);
  return {
    overallScore: 62,
    topStrength: 'Shows consistent effort in completing study sessions and engaging with challenging material.',
    topWeakness: `Needs to close the gap on "${gaps[0] ?? 'core concepts'}" before the exam.`,
    sections: [
      { title: 'Reasoning Quality', score: 58, summary: 'Foundational understanding present but deep causal reasoning is lacking. Surface-level answers are frequent.', keyFindings: [`${gaps.length} concept gap(s) detected`, 'Depth scores suggest shallow explanations', 'Misconception patterns indicate gaps'], recommendation: `Practice explaining "${gaps[0] ?? 'key concepts'}" without notes.` },
      { title: 'Study Consistency', score: 65, summary: 'Schedule adherence is moderate. Consistent daily review will compound before the exam.', keyFindings: [`${snapshot.scheduleAdherence.sessionsPlanned} sessions planned`, `${snapshot.scheduleAdherence.sessionsCompleted} completed`, `Priority gap: "${snapshot.scheduleAdherence.priorityGap}"`], recommendation: 'Block 30 minutes each morning for the priority gap.' },
      { title: 'Exam Readiness', score: 55, summary: 'Overall readiness is below target. Weak areas need focused attention in remaining time.', keyFindings: ['Readiness below 75% threshold', `${snapshot.examReadiness.weakAreas.length} weak area(s) identified`, 'Topic coverage needs improvement'], recommendation: 'Run one cross-examination per day on the weakest topic.' },
      { title: 'Concept Mastery', score: 60, summary: 'Concepts understood at surface level but application depth is insufficient for exam questions.', keyFindings: [`"${gaps[0] ?? 'Core concepts'}" requires deeper understanding`, `"${gaps[1] ?? 'Secondary topics'}" shows partial mastery`], recommendation: `Create a concept map connecting "${gaps[0] ?? 'key ideas'}" to real-world examples.` },
    ],
    actionPlan: [
      `Immediate action (next 24 hours): Re-read notes on "${gaps[0] ?? 'the priority gap'}" and write a 3-sentence explanation from memory`,
      'This week: Complete all planned sessions and run 2 cross-examinations on weak areas',
      'Before exam: Do a full timed mock exam and review every question scored below 70',
    ],
    predictedExamScore: 64,
    confidenceCalibration: 'well-calibrated',
  };
}
