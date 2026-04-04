/**
 * Custom hook managing room join, answer submissions, and real-time sync listener.
 * Owner: Developer 3 (Session & State)
 */
import { useEffect } from 'react';
import { useStore } from '../store/store';
import type { SessionState } from '../store/store';

export const useSession = (roomId: string) => {
  const setSession = useStore((state: SessionState) => state.setSession);

  useEffect(() => {
    // TODO: listen for real-time sync from Firebase / Supabase and call setSession
    void roomId;
  }, [roomId, setSession]);

  const submit = async (_userId: string, _text: string): Promise<void> => {
    // TODO: submit answer via sessionService and update store
  };

  return { submit };
};
