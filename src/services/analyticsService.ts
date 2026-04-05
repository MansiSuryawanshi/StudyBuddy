import type { QuizAttempt, TopicProgress } from '../types';

export interface MistakeDetail {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  feedback?: string | null;
  topic: string;
}

export interface TopicStat {
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  mistakes: MistakeDetail[];
}

export interface AnalyticsSummary {
  topicStats: TopicStat[];
  weakTopics: string[];
  strongTopics: string[];
  readinessScore: number;
  totalQuizzes: number;
  avgAccuracy: number;
  mistakeVault: Record<string, MistakeDetail[]>;
}

/**
 * Derives comprehensive student performance analytics from historical quiz attempts.
 * Implements factual mistake tracking and readiness score calculation.
 */
export function deriveStudentAnalytics(attempts: QuizAttempt[], daysLeft: number | null = null): AnalyticsSummary {
  console.group("[AnalyticsService] Deriving Performance Data");
  console.log(`Analyzing ${attempts.length} historical attempts. Days until exam: ${daysLeft ?? 'N/A'}`);

  if (attempts.length === 0) {
    console.log("No data available. Returning empty summary.");
    console.groupEnd();
    return {
      topicStats: [],
      weakTopics: [],
      strongTopics: [],
      readinessScore: 50,
      totalQuizzes: 0,
      avgAccuracy: 0,
      mistakeVault: {}
    };
  }

  const topicMap = new Map<string, TopicStat>();
  let totalScore = 0;

  // Process all attempts (assuming they are already ordered desc by createdAt)
  attempts.forEach((attempt) => {
    totalScore += attempt.accuracy;

    attempt.questionResults.forEach(res => {
      const topicName = res.topic || 'General';
      const entry = topicMap.get(topicName) || {
        name: topicName,
        total: 0,
        correct: 0,
        accuracy: 0,
        mistakes: []
      };

      entry.total += 1;
      if (res.isCorrect) {
        entry.correct += 1;
      } else {
        entry.mistakes.push({
          question: res.questionText,
          userAnswer: res.userAnswer,
          correctAnswer: res.correctAnswer,
          feedback: res.feedback,
          topic: topicName
        });
      }

      topicMap.set(topicName, entry);
    });
  });

  const topicStats: TopicStat[] = Array.from(topicMap.values()).map(stat => ({
    ...stat,
    accuracy: Math.round((stat.correct / stat.total) * 100)
  }));

  // Sort topics by accuracy ascending
  topicStats.sort((a, b) => a.accuracy - b.accuracy);

  const weakTopics = topicStats.filter(t => t.accuracy < 70).map(t => t.name);
  const strongTopics = topicStats.filter(t => t.accuracy >= 85).map(t => t.name);

  // Recency-biased Readiness Score Calculation
  // Last 3 quizzes carry more weight (60%) if available
  const recentAttempts = attempts.slice(0, 3);
  const recentAvg = recentAttempts.length > 0 
    ? recentAttempts.reduce((sum, a) => sum + a.accuracy, 0) / recentAttempts.length
    : 0;
  
  const overallAvg = totalScore / attempts.length;
  
  let readinessScore = 50;
  if (recentAttempts.length > 0) {
    readinessScore = Math.round((recentAvg * 0.6) + (overallAvg * 0.4));
  } else {
    readinessScore = Math.round(overallAvg);
  }

  // Time-Urgency Adjustment (The "Deadline Penalty")
  // If the exam is very close, we penalise a low readiness score to show urgency.
  if (daysLeft !== null && daysLeft >= 0) {
    if (daysLeft <= 3 && readinessScore < 85) {
      // High urgency drop
      readinessScore = Math.max(0, readinessScore - 15);
      console.log(`[Analytics] Urgency Penalty applied: -15 due to ${daysLeft} days remaining.`);
    } else if (daysLeft <= 7 && readinessScore < 70) {
      // Moderate urgency drop
      readinessScore = Math.max(0, readinessScore - 8);
      console.log(`[Analytics] Urgency Penalty applied: -8 due to ${daysLeft} days remaining.`);
    }
  }

  // Build Mistake Vault for Socratic probing
  const mistakeVault: Record<string, MistakeDetail[]> = {};
  topicStats.forEach(stat => {
    if (stat.mistakes.length > 0) {
      mistakeVault[stat.name] = stat.mistakes;
    }
  });

  console.log(`Derived ${topicStats.length} topics.`);
  console.log(`Weak Areas identified: ${weakTopics.length > 0 ? weakTopics.join(", ") : 'None'}`);
  console.log(`Calculated Readiness Score: ${readinessScore}`);
  console.groupEnd();

  return {
    topicStats,
    weakTopics,
    strongTopics,
    readinessScore,
    totalQuizzes: attempts.length,
    avgAccuracy: Math.round(overallAvg),
    mistakeVault
  };
}

/**
 * Converts TopicStat into TopicProgress for legacy components.
 */
export function mapStatsToProgress(stats: TopicStat[]): TopicProgress[] {
  return stats.map(s => ({
    name: s.name,
    percentage: s.accuracy
  }));
}
