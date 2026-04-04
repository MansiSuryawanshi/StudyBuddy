/**
 * Session backend calls — Firebase Realtime Database or Supabase.
 * Owner: Developer 3 (Session & State)
 */

export const createSession = async (): Promise<void> => {
  // TODO: create a new session in the database
};

export const joinSession = async (_roomId: string): Promise<void> => {
  // TODO: join an existing session by roomId
};

export const submitAnswer = async (
  _roomId: string,
  _userId: string,
  _answer: unknown
): Promise<void> => {
  // TODO: persist the answer to the database
};

export const fetchResultsHistory = async (_userId: string): Promise<unknown[]> => {
  return [];
};
