/**
 * Hooks that watches for both answers, triggers claudeService, and pushes to global state.
 * Owner: Developer 3 (Session & State)
 */
import { useEffect } from 'react';
import { useStore } from '../store/store';
import { api } from '../services/api';

export const useScoring = () => {
  const session = useStore((state) => state.session);

  useEffect(() => {
    // If both players have submitted answers, trigger api.claude.scoreAnswers
    // and wait for structural evaluation
  }, [session?.answers]);

  return {};
};
