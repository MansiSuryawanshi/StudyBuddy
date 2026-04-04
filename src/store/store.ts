/**
 * Global state management via Zustand for managing active session flow and study schedule.
 * Owner: Developer 3 (Session & State)
 */
import { create } from 'zustand';
import type { Session } from '../types';
import type { ScheduleResponse } from '../types';

interface SessionState {
  session: Session | null;
  schedule: ScheduleResponse | null;
  setSession: (session: Session) => void;
  updatePhase: (phase: Session['phase']) => void;
  setSchedule: (schedule: ScheduleResponse) => void;
}

export const useStore = create<SessionState>((set) => ({
  session: null,
  schedule: null,
  setSession: (session) => set({ session }),
  updatePhase: (phase) =>
    set((state) => ({
      session: state.session ? { ...state.session, phase } : null,
    })),
  setSchedule: (schedule) => set({ schedule }),
}));
