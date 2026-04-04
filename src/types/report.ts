export interface StudySnapshot {
  quizSessions: {
    question: string;
    scoreA: number;
    scoreB: number;
    conceptGaps: string[];
    misconceptions: string[];
    depthInsight: string;
  }[];
  scheduleAdherence: {
    sessionsPlanned: number;
    sessionsCompleted: number;
    priorityGap: string;
  };
  examReadiness: {
    overallScore: number;
    topicCoverage: { topic: string; percentage: number }[];
    weakAreas: string[];
    crossExamsPassed: number;
    crossExamsFailed: number;
  };
}

export interface ReportSection {
  title: string;
  score: number;
  summary: string;
  keyFindings: string[];
  recommendation: string;
}

export interface GeneratedReport {
  overallScore: number;
  topStrength: string;
  topWeakness: string;
  sections: ReportSection[];
  actionPlan: string[];
  predictedExamScore: number;
  confidenceCalibration: string;
}

export interface StudyReport extends GeneratedReport {
  id: string;
  createdAt: Date | null;
  studentId: string;
  summary: string;
  rawData: StudySnapshot;
}
