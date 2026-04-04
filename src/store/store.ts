/**
 * Global state management via Zustand for active session flow.
 * Owner: Developer 3 (Session & State)
 */
import { create } from 'zustand';
import type { Session, SessionPhase } from '../types';

export interface SessionState {
  session: Session | null;
  setSession: (session: Session) => void;
  updatePhase: (phase: SessionPhase) => void;
}

export const useStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session: Session) => set({ session }),
  updatePhase: (phase: SessionPhase) =>
    set((state: SessionState) => ({
      session: state.session ? { ...state.session, phase } : null,
    })),
}));
