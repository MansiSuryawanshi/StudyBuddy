/**
 * Custom hook managing room join, answer submissions, and listening for opponent sync.
 * Owner: Developer 3 (Session & State)
 */
import { useEffect } from 'react';
import * as sessionService from '../services/sessionService';
import { useStore } from '../store/store';

export const useSession = (roomId: string) => {
  const setSession = useStore((state) => state.setSession);

  useEffect(() => {
    // Listen for realtime sync from Firebase / Supabase and update store
  }, [roomId]);

  const submit = async (userId: string, text: string) => {
    // Submit answer logic
  };

  return { submit };
};
