

export type QuestionType = "mcq";

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[]; // Options are now mandatory
  correctAnswer: string;
  explanation?: string;
  sourceTopic?: string;
}

import { ANTHROPIC_MODEL } from "../config/aiConfig";

const CLAUDE_URL = '/anthropic/v1/messages';

/**
 * Validates that a generated question is grounded in content and has exactly 4 options.
 */
function validateQuestionQuality(q: GeneratedQuestion): boolean {
  const bannedSubstrings = ["[Parsing", "filename", "placeholder", "upload"];
  const content = (q.question + " " + q.correctAnswer).toLowerCase();
  
  if (bannedSubstrings.some(b => content.includes(b.toLowerCase()))) return false;
  if (q.question.length < 15) return false;
  if (!q.options || q.options.length !== 4) return false;
  
  return true;
}

/**
 * Generates an MCQ-only quiz from the provided study material using the Claude API.
 */
export async function generateQuizFromContent(content: string, questionCount: number = 5): Promise<GeneratedQuestion[]> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  console.group(`[QuizService-Pipeline] MCQ GENERATION START`);
  
  const prompt = `
    Analyze the following study material and generate a high-quality Multiple Choice (MCQ) quiz.
    
    Material:
    ${content}
    
    Rules:
    1. Generate exactly ${questionCount} MCQs.
    2. ONLY generate Multiple Choice questions. Never generate descriptive, summary, or open-ended questions.
    3. Each question MUST have exactly 4 distinct options.
    4. Provide exactly 1 correct answer string that matches one of the options.
    5. ABSOLUTELY FORBIDDEN: Do not mention "parsing", "file names", or "upload artifacts".
    6. Return ONLY valid JSON in this exact structure:
       [
         {
           "id": "q1",
           "type": "mcq",
           "question": "string",
           "options": ["A", "B", "C", "D"],
           "correctAnswer": "string",
           "explanation": "string",
           "sourceTopic": "string"
         },
         ...
       ]
  `;

  try {
    if (!apiKey) {
      console.warn("Pipeline Fail: No API Key. Routing to Fallback MCQ Engine.");
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
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.groupEnd();
      return generateFallbackQuiz(content, questionCount);
    }

    const data = await response.json();
    const text: string = data.content[0].text;
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const rawParsed: GeneratedQuestion[] = JSON.parse(cleaned);

    const acceptedQuestions = rawParsed.filter(validateQuestionQuality);

    if (acceptedQuestions.length < questionCount) {
      const missingCount = questionCount - acceptedQuestions.length;
      const topUp = await generateFallbackQuiz(content, missingCount);
      const finalSet = [...acceptedQuestions, ...topUp];
      console.groupEnd();
      return finalSet;
    }

    console.groupEnd();
    return acceptedQuestions.slice(0, questionCount); 

  } catch (error) {
    console.groupEnd();
    return generateFallbackQuiz(content, questionCount);
  }
}

/**
 * Deterministic MCQ fallback generator.
 */
export async function generateFallbackQuiz(content: string, count: number): Promise<GeneratedQuestion[]> {
  console.log(`[QuizService-Fallback] MCQ Mode: Generating ${count} questions...`);
  
  const cleanContent = content.replace(/\[Parsing Content from.*?\]/gi, "").trim();
  const sentences = cleanContent.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
  const questions: GeneratedQuestion[] = [];

  const emergencyQuestions = [
    {
      question: "Based on your general study intent, which of these is the most effective review strategy?",
      options: ["Active Recall", "Passive Reading", "Highlighting", "Cramming"],
      correctAnswer: "Active Recall"
    },
    {
      question: "When reviewing study notes, what should be your primary focus?",
      options: ["Understanding Core Concepts", "Memorizing Formatting", "Counting Pages", "Ignoring Difficult Sections"],
      correctAnswer: "Understanding Core Concepts"
    },
    {
      question: "Which of the following is the best indicator of true comprehension?",
      options: ["Teaching the concept clearly to someone else", "Reading the text multiple times", "Highlighting every sentence", "Copying notes word-for-word"],
      correctAnswer: "Teaching the concept clearly to someone else"
    },
    {
      question: "What is the primary benefit of the 'spaced repetition' technique?",
      options: ["Combats the forgetting curve over time", "Allows for easier cramming before exams", "Requires zero active effort", "Only works for vocabulary words"],
      correctAnswer: "Combats the forgetting curve over time"
    },
    {
      question: "How should you best approach difficult practice questions?",
      options: ["Attempt them, review mistakes, and adapt", "Skip them immediately", "Look at the answer key first", "Guess randomly without reviewing"],
      correctAnswer: "Attempt them, review mistakes, and adapt"
    }
  ];

  for (let i = 0; i < count; i++) {
    const id = `fb-mcq-${i}-${Date.now()}`;
    
    if (sentences.length > 0) {
      const s = sentences[i % sentences.length];
      
      if (i % 2 === 0) {
        // Validation MCQ
        questions.push({
          id,
          type: 'mcq',
          question: `According to the study material: "${s.slice(0, 100)}..."`,
          options: ["Is a correct statement", "Is a false statement", "Is not mentioned", "Is partially true"],
          correctAnswer: "Is a correct statement",
          explanation: "Grounding question based on a direct excerpt from your notes.",
          sourceTopic: "Content Review"
        });
      } else {
        // Identification MCQ
        const topic = s.split(' ').slice(0, 3).join(' ');
        questions.push({
          id,
          type: 'mcq',
          question: `Which topic is primarily addressed in the following context? "${s.slice(0, 120)}..."`,
          options: [topic, "An unrelated concept", "A general distractor", "A contrasting idea"],
          correctAnswer: topic,
          explanation: "Terminology check based on context clues in the material.",
          sourceTopic: "Terminology Extraction"
        });
      }
    } else {
      // Emergency Generic MCQs (Still Objective!)
      const eq = emergencyQuestions[i % emergencyQuestions.length];
      questions.push({
        id,
        type: 'mcq',
        question: `Question ${i + 1}: ${eq.question}`,
        options: eq.options,
        correctAnswer: eq.correctAnswer,
        explanation: "Meta-cognitive review question when no specific content is found.",
        sourceTopic: "Study Methodology"
      });
    }
  }

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
