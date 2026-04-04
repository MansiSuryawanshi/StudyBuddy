import { useStore } from '../store/store';
import type { StudySnapshot } from '../types/report';
import type { QuizAttempt } from '../types';

export function useStudySnapshot(persistedAttempts: QuizAttempt[] = []): StudySnapshot {
  const session = useStore((state) => state.session);
  const schedule = useStore((state) => state.schedule);

  // 1. Map live session scores (if any)
  const sessionScores = Object.values(session?.scores ?? {});
  const sessionQuizUnits = sessionScores.map((score) => ({
    question: session?.currentQuestion?.question ?? 'Live Session Question',
    scoreA: score.student_a.total,
    scoreB: score.student_b.total,
    conceptGaps: [
      score.student_a.concept_gap,
      score.student_b.concept_gap,
    ].filter((g): g is string => g !== null),
    misconceptions: [
      score.student_a.misconception_name,
      score.student_b.misconception_name,
    ].filter((m): m is string => m !== null),
    depthInsight: score.depth_insight,
  }));

  // 2. Map persisted quiz attempts
  const persistedQuizUnits = persistedAttempts.map((attempt) => ({
    question: `Quiz on ${attempt.selectedFileNames.join(', ')}`,
    scoreA: attempt.accuracy,
    scoreB: attempt.accuracy, // Simplified for single player persisted
    conceptGaps: attempt.weakTopics,
    misconceptions: [],
    depthInsight: `Accuracy: ${attempt.accuracy}%, Correct: ${attempt.correctCount}/${attempt.totalQuestions}`,
  }));

  const allQuizSessions = [...sessionQuizUnits, ...persistedQuizUnits];

  const sessionsPlanned =
    schedule?.schedule.reduce((sum, day) => sum + day.sessions.length, 0) ?? 0;

  const allWeakAreas = [...new Set([
    ...allQuizSessions.flatMap(s => s.conceptGaps)
  ])];

  return {
    quizSessions: allQuizSessions,
    scheduleAdherence: {
      sessionsPlanned,
      sessionsCompleted: persistedAttempts.length, // Each quiz is a completed session
      priorityGap: schedule?.priority_gap ?? 'Not yet assessed',
    },
    examReadiness: {
      overallScore: allQuizSessions.length > 0 
        ? Math.round(allQuizSessions.reduce((acc, s) => acc + s.scoreA, 0) / allQuizSessions.length)
        : 0,
      topicCoverage: [],
      weakAreas: allWeakAreas,
      crossExamsPassed: allQuizSessions.filter(s => s.scoreA >= 70).length,
      crossExamsFailed: allQuizSessions.filter(s => s.scoreA < 70).length,
    },
  };
}

