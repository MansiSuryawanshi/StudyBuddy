/**
 * Global state management via Zustand for active session flow and study schedule.
 * Owner: Developer 3 (Session & State)
 */
import { create } from 'zustand';
import type { Session, SessionPhase } from '../types';
import type { ScheduleResponse } from '../types';

export interface SessionState {
  session: Session | null;
  schedule: ScheduleResponse | null;
  setSession: (session: Session) => void;
  updatePhase: (phase: SessionPhase) => void;
  setSchedule: (schedule: ScheduleResponse) => void;
}

export const useStore = create<SessionState>((set) => ({
  session: null,
  schedule: null,
  setSession: (session: Session) => set({ session }),
  updatePhase: (phase: SessionPhase) =>
    set((state: SessionState) => ({
      session: state.session ? { ...state.session, phase } : null,
    })),
  setSchedule: (schedule) => set({ schedule }),
}));
