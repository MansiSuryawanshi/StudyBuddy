

export type QuestionType = "mcq" | "short_answer";

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceTopic?: string;
}

import { ANTHROPIC_MODEL } from "../config/aiConfig";

const CLAUDE_URL = '/anthropic/v1/messages';

/**
 * Generates a quiz from the provided study material using the Claude API.
 */
export async function generateQuizFromContent(content: string, questionCount: number = 5): Promise<GeneratedQuestion[]> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  console.group(`[QuizService] Generation Pipeline Started`);
  console.log(`Step 1: Model check. Using: ${ANTHROPIC_MODEL}`);
  console.log(`Step 2: Content check. Length: ${content.length} characters.`);
  console.log(`Step 3: Requesting ${questionCount} questions...`);

  const prompt = `
    You are an expert educational content generator. Analyze the following study material and generate a high-quality quiz.
    
    Material:
    ${content}
    
    Generation Rules:
    1. Generate exactly ${questionCount} questions based ONLY on the content provided above.
    2. Mix Multiple Choice (mcq) and Short Answer (short_answer) questions.
    3. For MCQs, provide exactly 4 options.
    4. For Short Answer, provide a clear, concise correct answer and an explanation.
    5. Ensure questions are traceable to specific topics in the material.
    6. Return ONLY valid JSON in this exact structure:
       [
         {
           "id": "q1",
           "type": "mcq",
           "question": "string",
           "options": ["string", "string", "string", "string"],
           "correctAnswer": "string",
           "explanation": "string",
           "sourceTopic": "string"
         },
         ...
       ]
  `;

  try {
    if (!apiKey) {
      console.warn("Step 4.FAIL: No Claude API Key found. Triggering fallback...");
      console.groupEnd();
      return generateFallbackQuiz(content, questionCount);
    }

    const response = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`Step 4.FAIL: API ${response.status} Error. Triggering fallback...`);
      console.error(errorBody);
      console.groupEnd();
      return generateFallbackQuiz(content, questionCount);
    }

    const data = await response.json();
    const text: string = data.content[0].text;
    
    // Strip markdown fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed: GeneratedQuestion[] = JSON.parse(cleaned);

    console.log(`Step 4.SUCCESS: Received ${parsed.length} questions from AI.`);
    console.groupEnd();
    return parsed;

  } catch (error) {
    console.warn("Step 4.CRITICAL: Pipeline crashed. Triggering emergency fallback...");
    console.error(error);
    console.groupEnd();
    return generateFallbackQuiz(content, questionCount);
  }
}

/**
 * Deterministic fallback generator for when AI fails.
 * Parses content locally to extract basic terminology and concepts.
 */
export async function generateFallbackQuiz(content: string, count: number): Promise<GeneratedQuestion[]> {
  console.log(`[QuizService-Fallback] Rule-based extraction starting for ${count} questions...`);
  
  // Simple heuristic: find sentences that look like definitions (contain "is", "defined as", ":")
  const sentences = content.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const s = sentences[i];
    const words = s.split(' ');
    
    if (i % 2 === 0 && words.length > 5) {
      // Create a Short Answer question
      questions.push({
        id: `fb-q${i}`,
        type: 'short_answer',
        question: `Based on your material, explain the significance or meaning of: "${words.slice(0, 3).join(' ')}..."`,
        correctAnswer: s,
        explanation: "This question was derived directly from your study notes as an AI fallback.",
        sourceTopic: "Extracted Content"
      });
    } else {
      // Create a dummy MCQ to maintain flow
      questions.push({
        id: `fb-q${i}`,
        type: 'mcq',
        question: `True or False: The following statement is directly from your notes: "${s.slice(0, 60)}..."`,
        options: ["True", "False", "Partially True", "Not in material"],
        correctAnswer: "True",
        explanation: "This verification question ensures you are reviewing the core text even if the AI is offline.",
        sourceTopic: "Material Review"
      });
    }
  }

  // If no content is found, use generic study questions
  if (questions.length === 0) {
    questions.push({
      id: "fb-gen-1",
      type: "short_answer",
      question: "Summary Challenge: In your own words, what is the most important concept in the material you just uploaded?",
      correctAnswer: "Refer to your original notes for the specific core concepts.",
      explanation: "Active recall is the best way to anchor new knowledge.",
      sourceTopic: "Overview"
    });
  }

  console.log(`[QuizService-Fallback] SUCCESS: Generated ${questions.length} deterministic questions.`);
  return questions;
}

/**
 * Generates answers for a set of questions from Claude's perspective to act as a competitor.
 */
export async function generateClaudeCompetitorAnswers(
  questions: GeneratedQuestion[], 
  content: string
): Promise<Record<string, { answer: string; isCorrect: boolean }>> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  const prompt = `
    You are competing in a reasoning quiz based on this study material:
    ${content}
    
    Here are the questions:
    ${JSON.stringify(questions.map(q => ({ id: q.id, question: q.question, type: q.type, options: q.options })))}
    
    Rule:
    1. Answer every question correctly and with high reasoning depth.
    2. For MCQs, provide the exact option string.
    3. For Short Answer, provide a clear explanation.
    4. Return ONLY valid JSON:
       {
         "questionId": { "answer": "string", "isCorrect": true }
       }
  `;

  try {
    const response = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return {};

    const data = await response.json();
    const text: string = data.content[0].text;
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[QuizService] Error generating Claude answers (Competitor):", error);
    return {};
  }
}
