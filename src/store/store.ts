import { create } from 'zustand';
import type {
  Session,
  SessionPhase,
  GeneratedQuestion,
  ScheduleResponse,
  CrossExamRecord,
  TopicProgress,
  QuizAnswer,
} from '../types';

export interface SessionState {
  session: Session | null;
  schedule: ScheduleResponse | null;
  currentQuiz: GeneratedQuestion[] | null;

  // Exam Prep (Developer 3)
  readinessScore: number;
  weakAreas: string[];
  topicProgress: TopicProgress[];
  crossExamHistory: CrossExamRecord[];
  quizAnswers: QuizAnswer[];

  setSession: (session: Session) => void;
  setQuiz: (quiz: GeneratedQuestion[]) => void;
  updatePhase: (phase: SessionPhase) => void;
  setSchedule: (schedule: ScheduleResponse) => void;

  // Exam Prep actions
  adjustReadinessScore: (delta: number) => void;
  setReadinessScore: (score: number) => void;
  setWeakAreas: (areas: string[]) => void;
  setTopicProgress: (topics: TopicProgress[]) => void;
  addCrossExamRecord: (record: CrossExamRecord) => void;
  recordQuizAnswer: (answer: QuizAnswer) => void;
  clearQuizAnswers: () => void;
}

export const useStore = create<SessionState>((set) => ({
  session: null,
  schedule: null,
  currentQuiz: null,

  readinessScore: 50,
  weakAreas: [],
  topicProgress: [],
  crossExamHistory: [],
  quizAnswers: [],

  setSession: (session: Session) => set({ session }),
  setQuiz: (quiz: GeneratedQuestion[]) => set({ currentQuiz: quiz }),
  updatePhase: (phase: SessionPhase) =>
    set((state: SessionState) => ({
      session: state.session ? { ...state.session, phase } : null,
    })),
  setSchedule: (schedule) => set({ schedule }),

  adjustReadinessScore: (delta: number) =>
    set((state: SessionState) => ({
      readinessScore: Math.max(0, Math.min(100, state.readinessScore + delta)),
    })),
  setReadinessScore: (score: number) =>
    set({ readinessScore: Math.max(0, Math.min(100, score)) }),
  setWeakAreas: (areas: string[]) => set({ weakAreas: areas }),
  setTopicProgress: (topics: TopicProgress[]) => set({ topicProgress: topics }),
  addCrossExamRecord: (record: CrossExamRecord) =>
    set((state: SessionState) => ({
      crossExamHistory: [...state.crossExamHistory, record],
    })),
  recordQuizAnswer: (answer: QuizAnswer) =>
    set((state: SessionState) => ({
      quizAnswers: [...state.quizAnswers, answer],
    })),
  clearQuizAnswers: () => set({ quizAnswers: [] }),
}));
