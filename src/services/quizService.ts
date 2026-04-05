

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


/**
 * Generates a quiz from the provided study material using the Claude API.
 */
export async function generateQuizFromContent(content: string, questionCount: number = 5): Promise<GeneratedQuestion[]> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  console.log(`Using Anthropic model: ${ANTHROPIC_MODEL}`);
  console.log(`[QuizService] Generating ${questionCount} questions using model: ${ANTHROPIC_MODEL}`);

  
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text: string = data.content[0].text;

    // Strip markdown fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed: GeneratedQuestion[] = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    console.error("Error generating quiz: ", error);
    throw error;
  }
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await response.json();
    const text: string = data.content[0].text;
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[QuizService] Error generating Claude answers:", error);
    return {};
  }
}
