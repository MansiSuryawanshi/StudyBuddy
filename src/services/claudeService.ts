/**
 * Claude API Service Layer — all Claude API calls live here.
 * Owner: Developer 2 (Claude API Service)
 */
import type { ScheduleResponse, FollowUpResult, DefenseEvaluation } from '../types';
import type { ScoreResult } from '../types/index';
import type { StudySnapshot, GeneratedReport } from '../types/report';

const CLAUDE_URL = '/anthropic/v1/messages';
import { ANTHROPIC_MODEL } from '../config/aiConfig';


function getApiKey(): string {
  return import.meta.env.VITE_CLAUDE_API_KEY as string;
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

function extractJson(text: string): string {
  // Strip markdown fences (handles ```json, ```, multiline)
  let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();
  // If no fences were found, use original text
  if (cleaned === text.trim()) cleaned = text.trim();
  // If still doesn't start with { or [, pull out the first JSON block
  if (cleaned[0] !== '{' && cleaned[0] !== '[') {
    const m = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (m) cleaned = m[1];
  }
  return cleaned;
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

  console.log(`Using Anthropic model: ${ANTHROPIC_MODEL}`);
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,

      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  return JSON.parse(extractJson(data.content[0].text)) as ScoreResult;
}

/**
 * Evaluates a descriptive (short answer) question semantically.
 * Returns whether the answer is correct and provides feedback.
 */
export async function evaluateShortAnswer(
  question: string,
  userAnswer: string,
  expectedAnswer: string,
  explanation?: string
): Promise<{ isCorrect: boolean; feedback: string }> {
  // 1. Simple normalization for minimal variation
  const normUser = userAnswer.trim().toLowerCase();
  const normExpected = expectedAnswer.trim().toLowerCase();
  
  if (normUser === normExpected) {
    return { isCorrect: true, feedback: "Exact match!" };
  }

  // 2. Perform semantic evaluation with Claude
  const prompt = `You are an educational grader. 
Question: "${question}"
User's Answer: "${userAnswer}"
Correct/Expected Answer: "${expectedAnswer}"
Reference Explanation: "${explanation || 'N/A'}"

Evaluate if the user's answer is semantically correct and covers the core concepts, even if worded differently.
Respond ONLY with a JSON object: 
{"isCorrect": true/false, "feedback": "one short sentence explaining why"}

Strictness: If the answer is factually correct but uses synonyms or phrasing changes, mark it TRUE. If it misses the core point or is factually wrong, mark it FALSE.`;

  console.log(`[Claude] Descriptive answer evaluation started...`);
  try {
    const response = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("API call failed");

    const data = await response.json() as { content: { text: string }[] };
    const result = JSON.parse(extractJson(data.content[0].text)) as { isCorrect: boolean; feedback: string };
    console.log(`[Claude] Evaluation result: ${result.isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    return result;
  } catch (error) {
    console.error("[Claude] Semantic evaluation failed. Falling back to fuzzy matching.", error);
    // Rough fallback: if user answer contains most of the expected answer words
    const points = expectedAnswer.toLowerCase().split(' ').filter(w => w.length > 3);
    const matches = points.filter(p => normUser.includes(p));
    const isCorrect = matches.length >= Math.ceil(points.length * 0.6);
    return { isCorrect, feedback: isCorrect ? "Fuzzy match success." : "Does not match core requirements." };
  }
}

// ── generateFollowUp ─────────────────────────────────────────────────────────
export const generateFollowUp = async (
  question: string,
  pastAnswer: string,
  depthScore: number,
): Promise<FollowUpResult> => {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are a Socratic examiner. A student answered:\n\nQuestion: ${question}\nAnswer: ${pastAnswer}\nDepth score: ${depthScore}/10\n\nGenerate a probing follow-up targeting their weakest point. Respond ONLY with JSON:\n{"followup_question":"...","weak_point_targeted":"...","deep_answer_covers":["...","...","..."],"score_if_passed":${Math.min(depthScore + 1.5, 10)},"score_if_failed":${Math.max(depthScore - 2, 0)}}`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${res.statusText}`);
  const data = await res.json() as { content: { text: string }[] };
  return JSON.parse(extractJson(data.content[0].text)) as FollowUpResult;
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
  topicAccuracy?: { topic: string; accuracy: number }[],
): Promise<ScheduleResponse> => {
  const apiKey = getApiKey();

  // Build per-topic accuracy context so Claude allocates more time to weak topics
  const topicContext = topicAccuracy && topicAccuracy.length > 0
    ? `\nPer-topic quiz accuracy (lower = needs more study time):\n${topicAccuracy
        .sort((a, b) => a.accuracy - b.accuracy)
        .map(t => `  - ${t.topic}: ${t.accuracy}% correct`)
        .join('\n')}`
    : '';

  const prompt = `You are an adaptive learning coach for college students.

The student has these concept gaps identified from real historical quiz sessions:
Gaps (sorted weakest first): ${JSON.stringify(gaps)}
Average understanding score: ${avgScore}/100
Days until exam: ${daysToExam}${topicContext}

ADAPTIVE STRATEGY BASED ON DAYS LEFT (${daysToExam}):
- 0-3 days (URGENT): "Sprint Mode". Focus ONLY on the most critical weak areas. Shorter, high-intensity sessions. Rationale should mention "Critical window".
- 4-10 days (TIGHT): "Gap Closure Mode". Heavy focus on weak areas, but include 1-2 review sessions for strong topics.
- 11+ days (BALANCED): "Mastery Mode". Evenly spread sessions, deep dives into complex topics, and spaced repetition.

IMPORTANT RULES:
- Topics with lower accuracy MUST get more sessions and longer durations (e.g. 60 min instead of 30 min)
- The weakest topic should appear in every day's schedule
- Use badge_type "coral" for gap topics, "purple" for challenge/practice, "teal" for review
- For EACH session, provide a "rationale" field explaining why it was scheduled (e.g. "Urgency: High. Targeting core misconception in Recursion").

Generate a 3-day study schedule. Return ONLY a raw JSON object, no markdown, no backticks, no explanation:
{"schedule":[{"day":"Today · Monday","sessions":[{"time":"9:00 am","label":"session name","topic_tag":"gap focus","duration":"45 min","badge_type":"coral","targets_gap":"gap name or null","rationale":"short evidence string"}]}],"priority_gap":"most urgent gap","readiness_message":"one sentence"}`;

  try {
    if (!apiKey) {
      console.warn("[ClaudeService] No API key. Falling back to local generation...");
      return buildMockSchedule(gaps, avgScore, daysToExam, topicAccuracy);
    }

    console.log(`[ClaudeService] Generating schedule with ${ANTHROPIC_MODEL}...`);
    const response = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.warn(`[ClaudeService] API Error ${response.status}. Falling back to local...`);
      return buildMockSchedule(gaps, avgScore, daysToExam, topicAccuracy);
    }

    const data = await response.json() as { content: { text: string }[] };
    return { 
      ...JSON.parse(extractJson(data.content[0].text)),
      isFallback: false 
    } as ScheduleResponse;

  } catch (err) {
    console.group("[ClaudeService-FAIL] Generation error");
    console.error(err);
    console.log("Triggering local fallback generator...");
    console.groupEnd();
    return buildMockSchedule(gaps, avgScore, daysToExam, topicAccuracy);
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

  console.log(`Using Anthropic model: ${ANTHROPIC_MODEL}`);
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,

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
    return JSON.parse(extractJson(data.content[0].text)) as GeneratedReport;
  } catch {
    throw new Error('Claude returned invalid JSON for the report. Try again.');
  }
};

// ── Mock fallbacks ────────────────────────────────────────────────────────────
function buildMockSchedule(
  gaps: string[],
  _avgScore: number,
  daysToExam: number,
  topicAccuracy?: { topic: string; accuracy: number }[]
): ScheduleResponse {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDate = new Date();
  
  const getDayName = (offset: number) => {
    const d = new Date();
    d.setDate(todayDate.getDate() + offset);
    return dayNames[d.getDay()];
  };

  const priorityGap = gaps[0] ?? 'General review';
  
  // Sort topics by accuracy to prioritize weakest
  const sortedTopics = topicAccuracy 
    ? [...topicAccuracy].sort((a, b) => a.accuracy - b.accuracy)
    : gaps.map(g => ({ topic: g, accuracy: 50 }));

  const plan: ScheduleResponse = {
    isFallback: true,
    priority_gap: priorityGap,
    readiness_message: daysToExam < 4 
      ? "SPRINT MODE: Focusing on your most critical gaps before the deadline."
      : "GAP CLOSURE: Methodical review of identifies weaknesses.",
    schedule: [
      {
        day: `Today · ${getDayName(0)}`,
        sessions: [
          { 
            time: '9:00 am', 
            label: `Critical Gap: ${priorityGap}`, 
            topic_tag: 'Gap Focus', 
            duration: '60 min', 
            badge_type: 'coral', 
            targets_gap: priorityGap,
            rationale: "Highest priority gap identified from recent quiz performance."
          },
          { 
            time: '2:00 pm', 
            label: 'Mixed Practice Arena', 
            topic_tag: 'active recall', 
            duration: '30 min', 
            badge_type: 'purple', 
            targets_gap: null,
            rationale: "Broad reinforcement across all current topics."
          }
        ]
      },
      {
        day: getDayName(1),
        sessions: [
          { 
            time: '10:00 am', 
            label: sortedTopics[1] ? `Targeted Study: ${sortedTopics[1].topic}` : 'Concept Review', 
            topic_tag: 'Weak Topic', 
            duration: '45 min', 
            badge_type: 'coral', 
            targets_gap: sortedTopics[1]?.topic ?? null,
            rationale: "Addressing secondary concept gaps to build foundational strength."
          },
          { 
            time: '4:00 pm', 
            label: 'Exam Prep Simulation', 
            topic_tag: 'Mock Exam', 
            duration: '40 min', 
            badge_type: 'purple', 
            targets_gap: null,
            rationale: "Timed simulation to build exam-day stamina."
          }
        ]
      },
      {
        day: getDayName(2),
        sessions: [
          { 
            time: '9:30 am', 
            label: `Mastery Review: ${priorityGap}`, 
            topic_tag: 'Spaced Repetition', 
            duration: '45 min', 
            badge_type: 'teal', 
            targets_gap: priorityGap,
            rationale: "Revisiting weakest area to consolidate long-term memory."
          }
        ]
      }
    ]
  };

  return plan;
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

// ── evaluateDefense ───────────────────────────────────────────────────────────
export const evaluateDefense = async (
  question: string,
  _pastAnswer: string,
  followUpQuestion: string,
  defenseAnswer: string,
  deepAnswerCovers: string[],
): Promise<DefenseEvaluation> => {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Evaluate this student's defense.\n\nOriginal question: ${question}\nFollow-up: ${followUpQuestion}\nDefense: ${defenseAnswer}\nExpected coverage: ${deepAnswerCovers.join(', ')}\n\nRespond ONLY with JSON:\n{"passed":true,"strength":"strong","what_they_got_right":"...or null","what_they_missed":"...or null","verdict_label":"Gap closed"}`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${res.statusText}`);
  const data = await res.json() as { content: { text: string }[] };
  return JSON.parse(extractJson(data.content[0].text)) as DefenseEvaluation;
};
