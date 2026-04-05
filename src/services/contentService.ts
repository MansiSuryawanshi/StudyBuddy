/**
 * StudyBuddy Content Quality Service — cleans and validates study material.
 */

const PLACEHOLDER_PATTERN = /\[Parsing Content from.*?\]/gi;
const BOILERPLATE_PATTERNS = [
  /uploaded by/gi,
  /all rights reserved/gi,
  /terms and conditions/gi,
  /confidential/gi,
  /pg \d+/gi // Page numbers
];

export interface CleaningResult {
  cleanedText: string;
  originalLength: number;
  cleanedLength: number;
  detectedTopics: string[];
}

/**
 * Strips placeholders, metadata noise, and boilerplate from raw study text.
 */
export function cleanStudyContent(text: string): CleaningResult {
  const originalLength = text.length;
  
  // 1. Remove [Parsing...] placeholders
  let cleaned = text.replace(PLACEHOLDER_PATTERN, "");
  
  // 2. Remove common boilerplate
  BOILERPLATE_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, "");
  });
  
  // 3. Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // 4. Extract topics for grounding (simple heuristic)
  const detectedTopics = extractTopicsLocal(cleaned);
  
  return {
    cleanedText: cleaned,
    originalLength,
    cleanedLength: cleaned.length,
    detectedTopics
  };
}

/**
 * Evaluates if the content contains enough meaningful study material.
 */
export function validateContent(text: string): { isValid: boolean; reason?: string } {
  const { cleanedText } = cleanStudyContent(text);
  
  if (cleanedText.length < 50) {
    return { 
      isValid: false, 
      reason: "Material is too short to generate a meaningful quiz. Please paste more content." 
    };
  }
  
  if (PLACEHOLDER_PATTERN.test(text) && cleanedText.length === 0) {
    return { 
      isValid: false, 
      reason: "No real study content found — only placeholders. Please use 'Paste Text' mode for PDFs." 
    };
  }
  
  return { isValid: true };
}

/**
 * Extracts key terms based on frequency and capitalization.
 */
export function extractTopicsLocal(text: string): string[] {
  const words = text.split(/\s+/);
  const counts: Record<string, number> = {};
  
  const stopWords = new Set(["the", "and", "this", "that", "with", "from", "each", "other"]);
  
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length > 3 && !stopWords.has(clean)) {
      counts[clean] = (counts[clean] || 0) + 1;
    }
  });
  
  // Return top 5 most frequent significant words
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic.charAt(0).toUpperCase() + topic.slice(1));
}
