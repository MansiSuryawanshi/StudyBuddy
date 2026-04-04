/**
 * Assembles a StudySnapshot from all available store data.
 * Glues the three tabs together into a single input for generateReport().
 */
import { useStore } from '../store/store';
import type { StudySnapshot } from '../types/report';

export function useStudySnapshot(): StudySnapshot {
  const session = useStore((state) => state.session);
  const schedule = useStore((state) => state.schedule);

  const scores = Object.values(session?.scores ?? {});

  const quizSessions = scores.map((score) => ({
    question: session?.currentQuestion?.question ?? 'Not yet assessed',
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

  const sessionsPlanned =
    schedule?.schedule.reduce((sum, day) => sum + day.sessions.length, 0) ?? 0;

  const allWeakAreas = [...new Set([
    ...scores.map((s) => s.student_a.concept_gap).filter((g): g is string => g !== null),
    ...scores.map((s) => s.student_b.concept_gap).filter((g): g is string => g !== null),
  ])];

  return {
    quizSessions,
    scheduleAdherence: {
      sessionsPlanned,
      sessionsCompleted: 0,
      priorityGap: schedule?.priority_gap ?? 'Not yet assessed',
    },
    examReadiness: {
      overallScore: 0,
      topicCoverage: [],
      weakAreas: allWeakAreas,
      crossExamsPassed: 0,
      crossExamsFailed: 0,
    },
  };
}
