/**
 * Global state management via Zustand (or Redux) for managing active session flow.
 * Owner: Developer 3 (Session & State)
 */
import { create } from 'zustand';
import { Session } from '../types';

interface SessionState {
  session: Session | null;
  setSession: (session: Session) => void;
  updatePhase: (phase: Session['phase']) => void;
}

export const useStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  updatePhase: (phase) => set((state) => ({ 
    session: state.session ? { ...state.session, phase } : null 
  }))
}));
