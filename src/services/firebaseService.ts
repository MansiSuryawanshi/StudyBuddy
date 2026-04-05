import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  setDoc,
  deleteDoc,
  where,
  onSnapshot,
  updateDoc,
  Timestamp 
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import type { QuizAttempt, ChallengeSession, Participant } from "../types";

/**
 * Stable User ID Management
 * Uses localStorage to persist a guest identity across reloads.
 */
function getPersistentUserId(): string {
  const key = "studybuddy_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    // Defaulting to "guest_user" to match environment shown in console
    id = "guest_user";
    localStorage.setItem(key, id);
    console.log(`[Firebase] User ID initialized to: ${id}`);
  } else {
    console.log(`[Firebase] Existing User ID loaded: ${id}`);
  }
  return id;
}

const USER_ID = getPersistentUserId();

export interface StudyDocument {
  id?: string;
  fileName: string;
  uploadedAt: any;
  rawText: string;
  extractedTopics?: string[];
  processed: boolean;
}

/**
 * Saves a new study document to Firebase Firestore.
 */
export async function saveDocument(fileName: string, rawText: string): Promise<string> {
  const path = `users/${USER_ID}/documents`;
  console.group(`[Firebase-WRITE] ${path}`);
  console.log(`[Firebase-Step 1] Initializing document structure...`);
  try {
    const userDocsRef = collection(db, "users", USER_ID, "documents");
    const newDoc = {
      fileName,
      rawText,
      uploadedAt: Timestamp.now(),
      processed: false,
      extractedTopics: []
    };
    
    console.log(`[Firebase-Step 2] Calling addDoc()...`);
    const docRef = await addDoc(userDocsRef, newDoc);
    console.log(`[Firebase-Step 2.Success] DocID: ${docRef.id} | Size: ${rawText.length} chars`);
    
    // Set this doc as the active one for the user
    console.log(`[Firebase-Step 3] Updating activeDocumentId...`);
    await setDoc(doc(db, "users", USER_ID), { activeDocumentId: docRef.id }, { merge: true });
    console.log(`[Firebase-Step 3.Success] activeDocumentId grounded.`);
    
    console.groupEnd();
    return docRef.id;
  } catch (error: any) {
    console.error(`[Firebase-Step.FAIL] Upload failed:`, error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Fetches the currently active document ID for the user.
 */
export async function getActiveDocumentId(): Promise<string | null> {
  const path = `users/${USER_ID} (activeDocumentId)`;
  console.group(`[Firebase-READ] ${path}`);
  try {
    const userRef = doc(db, "users", USER_ID);
    const userSnap = await getDoc(userRef);
    const result = userSnap.exists() ? (userSnap.data().activeDocumentId || null) : null;
    console.log(`Result: ${result}`);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error("Fetch failed:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * Retrieves the full study document based on its ID.
 */
export async function getDocumentById(docId: string): Promise<StudyDocument | null> {
  const path = `users/${USER_ID}/documents/${docId}`;
  console.group(`[Firebase-READ] ${path}`);
  try {
    const docRef = doc(db, "users", USER_ID, "documents", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = { id: docSnap.id, ...docSnap.data() } as StudyDocument;
      console.log(`Success: ${result.fileName}`);
      console.groupEnd();
      return result;
    }
    console.log("Not found.");
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("Fetch failed:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * Saves the user's target exam date to Firestore.
 */
export async function saveExamDate(dateStr: string): Promise<void> {
  const path = `users/${USER_ID} (examDate)`;
  console.group(`[Firebase-WRITE] ${path}`);
  try {
    const userRef = doc(db, "users", USER_ID);
    await setDoc(userRef, { examDate: dateStr }, { merge: true });
    console.log(`Saved: ${dateStr}`);
    console.groupEnd();
  } catch (error) {
    console.error("Save failed:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Fetches the user's target exam date from Firestore.
 */
export async function getExamDate(): Promise<string | null> {
  const path = `users/${USER_ID} (examDate)`;
  console.group(`[Firebase-READ] ${path}`);
  try {
    const userRef = doc(db, "users", USER_ID);
    const userSnap = await getDoc(userRef);
    const result = userSnap.exists() ? (userSnap.data().examDate || null) : null;
    console.log(`Result: ${result}`);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error("Fetch failed:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * Lists all documents for the current user, ordered by upload time.
 */
export async function listUserDocuments(): Promise<StudyDocument[]> {
  const path = `users/${USER_ID}/documents`;
  console.group(`[Firebase-READ] ${path}`);
  try {
    const userDocsRef = collection(db, "users", USER_ID, "documents");
    const q = query(userDocsRef, orderBy("uploadedAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log(`Documents Loaded: ${querySnapshot.docs.length}`);
    const results = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyDocument));
    console.groupEnd();
    return results;
  } catch (error) {
    console.error("List failed:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * Saves a completed quiz attempt to Firebase Firestore.
 */
export async function saveQuizAttempt(attempt: Omit<QuizAttempt, "id">): Promise<string | null> {
  const path = `users/${USER_ID}/quizAttempts`;
  console.group(`[Firebase-WRITE] ${path}`);
  try {
    const attemptsRef = collection(db, "users", USER_ID, "quizAttempts");
    const payload = {
      ...attempt,
      createdAt: Timestamp.now()
    };
    console.log("Payload:", payload);
    const docRef = await addDoc(attemptsRef, payload);
    console.log(`Success. DocID: ${docRef.id}`);
    console.groupEnd();
    return docRef.id;
  } catch (error) {
    console.error("Save Failed:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * Retrieves all quiz attempts for the current user.
 */
export async function getUserQuizAttempts(): Promise<QuizAttempt[]> {
  const path = `users/${USER_ID}/quizAttempts`;
  console.group(`[Firebase-READ] ${path}`);
  try {
    const attemptsRef = collection(db, "users", USER_ID, "quizAttempts");
    const q = query(attemptsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    console.log(`Documents Loaded: ${querySnapshot.docs.length}`);
    const results = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
    console.groupEnd();
    return results;
  } catch (error: any) {
    console.error(`Fetch Failed. Reason:`, error.message || error);
    console.groupEnd();
    return [];
  }
}

/**
 * Saves a Socratic Cross-Examination defense to Firebase.
 */
export async function saveCrossExamAttempt(attempt: any): Promise<string | null> {
  console.group("[Firebase] Save Cross-Exam Defense");
  try {
    const path = `users/${USER_ID}/crossExams`;
    console.log(`Target Path: ${path}`);
    const attemptsRef = collection(db, "users", USER_ID, "crossExams");
    const docRef = await addDoc(attemptsRef, {
      ...attempt,
      createdAt: Timestamp.now()
    });
    console.log(`Save Successful. DocID: ${docRef.id}`);
    console.groupEnd();
    return docRef.id;
  } catch (error) {
    console.error(`Save Failed for ${`users/${USER_ID}/crossExams`}:`, error);
    console.groupEnd();
    return null;
  }
}

/**
 * Removes a single study document and clears activeDocumentId if needed.
 */
export async function removeDocument(docId: string): Promise<void> {
  try {
    const docRef = doc(db, "users", USER_ID, "documents", docId);
    const activeId = await getActiveDocumentId();
    if (activeId === docId) {
      await setDoc(doc(db, "users", USER_ID), { activeDocumentId: null }, { merge: true });
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`[Firebase] Error removing document ${docId}: `, error);
    throw error;
  }
}

/**
 * Bulk removes multiple documents.
 */
export async function removeDocuments(docIds: string[]): Promise<void> {
  try {
    const activeId = await getActiveDocumentId();
    let activeCleared = false;
    const promises = docIds.map(async (id) => {
      const docRef = doc(db, "users", USER_ID, "documents", id);
      if (id === activeId) activeCleared = true;
      return deleteDoc(docRef);
    });
    await Promise.all(promises);
    if (activeCleared) {
      await setDoc(doc(db, "users", USER_ID), { activeDocumentId: null }, { merge: true });
    }
  } catch (error) {
    console.error("[Firebase] Error in bulk removal: ", error);
    throw error;
  }
}

// ── Multi-player / Challenge Sessions ─────────────────────────────────────────────

/**
 * Creates a new reasoning challenge session (multiplayer room).
 */
export async function createChallengeSession(
  hostId: string, 
  hostName: string, 
  docIds: string[], 
  docNames: string[],
  questionCount: number
): Promise<ChallengeSession | null> {
  console.log(`[Firebase] Creating session for ${hostName}`);
  
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sessionRef = collection(db, "sessions");
  
  const participant: Participant = {
    uid: hostId,
    name: hostName,
    isHost: true,
    joinedAt: Timestamp.now(),
    status: 'answering'
  };

  const sessionData: Omit<ChallengeSession, "id"> = {
    roomCode,
    hostId,
    docIds,
    docNames,
    questionCount,
    status: 'waiting',
    questions: [],
    participants: { [hostId]: participant },
    createdAt: Timestamp.now()
  };

  try {
    const docRef = await addDoc(sessionRef, sessionData);
    return { id: docRef.id, ...sessionData } as ChallengeSession;
  } catch (error) {
    console.error("[Firebase] Error creating session: ", error);
    return null;
  }
}

/**
 * Joins an existing challenge session by room code.
 */
export async function joinChallengeSession(
  roomCode: string, 
  userId: string, 
  userName: string
): Promise<ChallengeSession | null> {
  try {
    const sessionRef = collection(db, "sessions");
    const q = query(sessionRef, where("roomCode", "==", roomCode.toUpperCase()), where("status", "==", "waiting"));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      throw new Error("Room not found or already started.");
    }
    
    const sessionDoc = snap.docs[0];
    const session = { id: sessionDoc.id, ...sessionDoc.data() } as ChallengeSession;
    
    const participant: Participant = {
      uid: userId,
      name: userName,
      isHost: false,
      joinedAt: Timestamp.now(),
      status: 'answering'
    };
    
    await updateDoc(doc(db, "sessions", session.id), {
      [`participants.${userId}`]: participant
    });
    
    return { ...session, participants: { ...session.participants, [userId]: participant } };
  } catch (error) {
    console.error("[Firebase] Error joining session: ", error);
    throw error;
  }
}

/**
 * Real-time listener for challenge session updates.
 */
export function onChallengeSessionUpdate(sessionId: string, callback: (session: ChallengeSession) => void) {
  const sessionRef = doc(db, "sessions", sessionId);
  return onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as ChallengeSession);
    }
  });
}

export async function updateSession(sessionId: string, updates: Partial<ChallengeSession>) {
  const sessionRef = doc(db, "sessions", sessionId);
  await updateDoc(sessionRef, updates);
}

export async function submitParticipantResults(
  sessionId: string, 
  userId: string, 
  results: Participant["results"]
) {
  const sessionRef = doc(db, "sessions", sessionId);
  await updateDoc(sessionRef, {
    [`participants.${userId}.results`]: results,
    [`participants.${userId}.status`]: 'finished'
  });
}

export { USER_ID };
