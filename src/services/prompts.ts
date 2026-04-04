/**
 * Constants holding all Claude prompts templates, imported by claudeService.js.
 * Owner: Developer 2 (Claude API Service)
 */

export const PROMPTS = {
  SCORE_ANSWERS: `You are an expert tutor. Given this question: {question}, evaluate these two answers {answerA} and {answerB}...`,
  GENERATE_FOLLOW_UP: `Based on the student's answer: {answer} to this question: {question}, create a Socratic follow-up...`,
  DETECT_MISCONCEPTION: `Identify if the student's answer: {answer} to the question {question} contains named misconceptions...`,
  CALIBRATE_CONFIDENCE: `The student rated their confidence as {confidence} but scored {depthScore} in depth. Evaluate this...`,
  GENERATE_QUESTION: `Create a question about {topic} where both shallow and deep reasoning are possible...`
};
