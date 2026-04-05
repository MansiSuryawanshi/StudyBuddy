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

export interface StudyDocument {
  id?: string;
  fileName: string;
  uploadedAt: any;
  rawText: string;
  extractedTopics?: string[];
  processed: boolean;
}

export interface StudentScore {
  correctness: number;
  reasoning_depth: number;
  clarity: number;
  total: number;
  misconception_present: boolean;
  misconception_name: string | null;
  concept_gap: string | null;
}

export interface ScoreResult {
  student_a: StudentScore;
  student_b: StudentScore;
  depth_insight: string;
  same_answer_different_depth: boolean;
  winner: 'A' | 'B' | 'tie';
}

export type SessionPhase = 'question' | 'answering' | 'analyzing' | 'revealed';

export interface Answer {
  userId: string;
  text: string;
  timestamp: string;
  confidenceRating?: number;
}

export interface Session {
  roomId: string;
  phase: SessionPhase;
  currentQuestion: GeneratedQuestion | null;
  players: string[];
  answers: Record<string, Answer>;
  scores: Record<string, ScoreResult>;
}

export type BadgeType = 'coral' | 'purple' | 'teal';

export interface SessionSlotData {
  time: string;
  label: string;
  topic_tag: string;
  duration: string;
  badge_type: BadgeType;
  targets_gap: string | null;
}

export interface DaySchedule {
  day: string;
  sessions: SessionSlotData[];
}

export interface ScheduleResponse {
  schedule: DaySchedule[];
  priority_gap: string;
  readiness_message: string;
}
export interface QuizAttempt {
  id?: string;
  createdAt: any; // Firebase Timestamp
  selectedDocumentIds: string[];
  selectedFileNames: string[];
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  accuracy: number;
  questionResults: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
    topic?: string;
  }[];
  weakTopics: string[];
  strongTopics: string[];
  generatedFromContentLength: number;
}

// ── Exam Prep types (Developer 3) ─────────────────────────────────────────────

export interface FollowUpResult {
  followup_question: string;
  weak_point_targeted: string;
  deep_answer_covers: string[];
  score_if_passed: number;
  score_if_failed: number;
}

export interface DefenseEvaluation {
  passed: boolean;
  strength: 'strong' | 'adequate' | 'weak';
  what_they_got_right: string | null;
  what_they_missed: string | null;
  verdict_label: string;
}

export interface CrossExamRecord {
  originalQuestion: string;
  originalAnswer: string;
  followUpQuestion: string;
  defenseAnswer: string;
  passed: boolean;
  verdictLabel: string;
  scoreAdjustment: number;
}

export interface TopicProgress {
  name: string;
  percentage: number;
}

export interface QuizAnswer {
  questionId: string;
  sourceTopic: string;
  isCorrect: boolean | null; // null = ungraded short-answer
}

// ── Multiplayer / Challenge Types ─────────────────────────────────────────────

export interface Participant {
  uid: string;
  name: string;
  isHost: boolean;
  joinedAt: any;
  status: 'answering' | 'finished';
  results?: {
    score: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    answers: Record<string, string>; // questionId -> answer
  };
}

export interface ChallengeSession {
  id: string;
  roomCode: string;
  hostId: string;
  docIds: string[];
  docNames: string[];
  questionCount: number;
  status: 'waiting' | 'loading' | 'active' | 'completed';
  questions: GeneratedQuestion[];
  participants: Record<string, Participant>; // uid -> Participant
  claudeCompetitor?: boolean;
  createdAt: any;
}
