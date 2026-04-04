/**
 * Claude API Service Layer - executes calls to the Claude API and formats typed JSON responses.
 * Owner: Developer 2 (Claude API Service)
 */
import { PROMPTS } from './prompts';
import { ScheduleResponse } from '../types';

// Sends both answers in one call, returns structured score data across 4 dimensions + misconceptions
export const scoreAnswers = async (question: string, answerA: string, answerB: string) => {
  // Implementation
};

// Socratic cross-examiner, returns follow-up question and deep coverage expectations
export const generateFollowUp = async (question: string, answer: string, depthScore: number) => {
  // Implementation
};

// Detects specific named misconceptions with severity and corrections
export const detectMisconception = async (question: string, answer: string) => {
  // Implementation
};

// Calibrates student confidence vs actual depth, returns calibration pattern / exam risk
export const calibrateConfidence = async (question: string, answer: string, confidenceRating: number, depthScore: number) => {
  // Implementation
};

// Generates an optimal question where both shallow and deep conceptual answers are plausible
export const generateQuestion = async (topic: string) => {
  // Implementation
};

// Takes concept gaps array, returns a 3-day personalized study schedule targeting those gaps
export const generateSchedule = async (
  conceptGaps: string[],
  avgScore: number = 70,
  daysToExam: number = 7
): Promise<ScheduleResponse> => {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  const prompt = `You are an adaptive learning coach for college students.

The student has these concept gaps identified from recent sessions:
Gaps: ${JSON.stringify(conceptGaps)}
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
          "topic_tag": "gap focus / new topic / review",
          "duration": "30 min",
          "badge_type": "coral / purple / teal",
          "targets_gap": "which gap this addresses or null"
        }
      ]
    }
  ],
  "priority_gap": "the most urgent gap to close",
  "readiness_message": "one sentence on exam readiness"
}`;

  if (!apiKey) {
    // Return mock data when no API key is configured
    return getMockSchedule(conceptGaps);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text) as ScheduleResponse;
};

function getMockSchedule(gaps: string[]): ScheduleResponse {
  const days = ['Monday', 'Wednesday', 'Friday'];
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];

  const gapSessions = gaps.length > 0
    ? gaps.slice(0, 2).map((gap, i) => ({
        time: i === 0 ? '9:00 am' : '11:00 am',
        label: `Deep dive: ${gap}`,
        topic_tag: gap,
        duration: '45 min',
        badge_type: 'coral' as const,
        targets_gap: gap,
      }))
    : [
        { time: '9:00 am', label: 'Core concept review', topic_tag: 'review', duration: '30 min', badge_type: 'teal' as const, targets_gap: null },
      ];

  return {
    schedule: [
      {
        day: `Today · ${todayName}`,
        sessions: [
          ...gapSessions,
          { time: '2:00 pm', label: 'Reasoning challenge practice', topic_tag: 'challenge', duration: '30 min', badge_type: 'purple', targets_gap: null },
        ],
      },
      {
        day: `${days[1]}`,
        sessions: [
          gaps[0]
            ? { time: '10:00 am', label: `Reinforce: ${gaps[0]}`, topic_tag: gaps[0], duration: '40 min', badge_type: 'coral' as const, targets_gap: gaps[0] }
            : { time: '10:00 am', label: 'Concept mapping', topic_tag: 'review', duration: '40 min', badge_type: 'teal' as const, targets_gap: null },
          { time: '1:00 pm', label: 'Mixed practice quiz', topic_tag: 'challenge', duration: '30 min', badge_type: 'purple', targets_gap: null },
          { time: '3:00 pm', label: 'Review session notes', topic_tag: 'review', duration: '20 min', badge_type: 'teal', targets_gap: null },
        ],
      },
      {
        day: `${days[2]}`,
        sessions: [
          gaps[1]
            ? { time: '9:00 am', label: `Master: ${gaps[1]}`, topic_tag: gaps[1], duration: '45 min', badge_type: 'coral' as const, targets_gap: gaps[1] }
            : { time: '9:00 am', label: 'Full concept review', topic_tag: 'review', duration: '45 min', badge_type: 'teal' as const, targets_gap: null },
          { time: '12:00 pm', label: 'Exam simulation', topic_tag: 'challenge', duration: '60 min', badge_type: 'purple', targets_gap: null },
        ],
      },
    ],
    priority_gap: gaps[0] || 'General review',
    readiness_message:
      gaps.length > 0
        ? `Focus on closing ${gaps.length} identified gap${gaps.length > 1 ? 's' : ''} before the exam.`
        : 'You are on track — keep up the practice sessions.',
  };
}
