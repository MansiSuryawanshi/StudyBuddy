/**
 * Hook that watches for both answers, triggers claudeService, and pushes results to global state.
 * Owner: Developer 3 (Session & State)
 */
import { useEffect } from 'react';
import { useStore } from '../store/store';
import type { SessionState } from '../store/store';

export const useScoring = () => {
  const session = useStore((state: SessionState) => state.session);

  useEffect(() => {
    // TODO: when both players have submitted answers, call scoreAnswers and update store
  }, [session?.answers]);

  return {};
};
