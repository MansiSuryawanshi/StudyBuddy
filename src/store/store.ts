import { create } from 'zustand';
import type { Session, SessionPhase, GeneratedQuestion, ScheduleResponse } from '../types';

export interface SessionState {
  session: Session | null;
  schedule: ScheduleResponse | null;
  currentQuiz: GeneratedQuestion[] | null;
  setSession: (session: Session) => void;
  setQuiz: (quiz: GeneratedQuestion[]) => void;
  updatePhase: (phase: SessionPhase) => void;
  setSchedule: (schedule: ScheduleResponse) => void;
}

export const useStore = create<SessionState>((set) => ({
  session: null,
  schedule: null,
  currentQuiz: null,
  setSession: (session: Session) => set({ session }),
  setQuiz: (quiz: GeneratedQuestion[]) => set({ currentQuiz: quiz }),
  updatePhase: (phase: SessionPhase) =>
    set((state: SessionState) => ({
      session: state.session ? { ...state.session, phase } : null,
    })),
  setSchedule: (schedule) => set({ schedule }),
}));
