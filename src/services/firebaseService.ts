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
  Timestamp 
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import type { QuizAttempt } from "../types";



// Shared User ID for the current session (Simplified for demo, replace with auth UID)
const USER_ID = "guest_user";

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
  console.log(`[Firebase] Save Document started: ${fileName}`);
  try {
    const userDocsRef = collection(db, "users", USER_ID, "documents");
    const newDoc = {
      fileName,
      rawText,
      uploadedAt: Timestamp.now(),
      processed: false,
      extractedTopics: []
    };
    
    const docRef = await addDoc(userDocsRef, newDoc);
    console.log(`[Firebase] Document created with ID: ${docRef.id}`);
    
    // Set this doc as the active one for the user
    await setDoc(doc(db, "users", USER_ID), { activeDocumentId: docRef.id }, { merge: true });
    console.log(`[Firebase] activeDocumentId updated to: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error("[Firebase] Error saving document: ", error);
    throw error;
  }
}

/**
 * Fetches the currently active document ID for the user.
 */
export async function getActiveDocumentId(): Promise<string | null> {
  console.log("[Firebase] getActiveDocumentId started...");
  try {
    const userRef = doc(db, "users", USER_ID);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const docId = userSnap.data().activeDocumentId || null;
      if (docId) {
        console.log(`[Firebase] Active Document ID found: ${docId}`);
      } else {
        console.warn("[Firebase] No activeDocumentId found in user document.");
      }
      return docId;
    }
    console.warn("[Firebase] User document does not exist yet.");
    return null;
  } catch (error) {
    console.error("[Firebase] Error fetching active doc ID: ", error);
    return null;
  }
}

/**
 * Retrieves the full study document based on its ID.
 */
export async function getDocumentById(docId: string): Promise<StudyDocument | null> {
  console.log(`[Firebase] getDocumentById started for: ${docId}`);
  try {
    const docRef = doc(db, "users", USER_ID, "documents", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const doc = { id: docSnap.id, ...data } as StudyDocument;
      console.log(`[Firebase] Document loaded: ${doc.fileName}`);
      console.log(`[Firebase] rawText size: ${doc.rawText?.length || 0} characters.`);
      
      if (!doc.rawText) {
        console.error(`[Firebase] CRITICAL: Document ${docId} exists but rawText is missing or empty!`);
      }
      
      return doc;
    }
    console.error(`[Firebase] Document ${docId} does not exist in the collection.`);
    return null;
  } catch (error) {
    console.error(`[Firebase] Error fetching document ${docId}: `, error);
    return null;
  }
}

/**
 * Lists all documents for the current user, ordered by upload time.
 */
export async function listUserDocuments(): Promise<StudyDocument[]> {
  console.log("[Firebase] listUserDocuments started...");
  try {
    const userDocsRef = collection(db, "users", USER_ID, "documents");
    const q = query(userDocsRef, orderBy("uploadedAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log(`[Firebase] Found ${querySnapshot.size} user documents.`);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyDocument));
  } catch (error) {
    console.error("[Firebase] Error listing documents: ", error);
    return [];
  }
}

/**
 * Saves a completed quiz attempt to Firebase Firestore.
 */
export async function saveQuizAttempt(attempt: Omit<QuizAttempt, "id">): Promise<string | null> {
  console.log("[Firebase] saveQuizAttempt started...");
  try {
    const attemptsRef = collection(db, "users", USER_ID, "quizAttempts");
    const docRef = await addDoc(attemptsRef, {
      ...attempt,
      createdAt: Timestamp.now()
    });
    console.log(`[Firebase] Quiz attempt saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[Firebase] Error saving quiz attempt: ", error);
    return null;
  }
}

/**
 * Retrieves all quiz attempts for the current user.
 */
export async function getUserQuizAttempts(): Promise<QuizAttempt[]> {
  console.log("[Firebase] getUserQuizAttempts started...");
  try {
    const attemptsRef = collection(db, "users", USER_ID, "quizAttempts");
    const q = query(attemptsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log(`[Firebase] Found ${querySnapshot.size} quiz attempts.`);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
  } catch (error) {
    console.error("[Firebase] Error fetching quiz attempts: ", error);
    return [];
  }
}

/**
 * Removes a single study document and clears activeDocumentId if needed.
 */
export async function removeDocument(docId: string): Promise<void> {
  console.log(`[Firebase] removeDocument started for: ${docId}`);
  try {
    const docRef = doc(db, "users", USER_ID, "documents", docId);
    
    // Check if it's the active one
    const activeId = await getActiveDocumentId();
    if (activeId === docId) {
      console.log(`[Firebase] Clearing activeDocumentId for ${USER_ID}`);
      await setDoc(doc(db, "users", USER_ID), { activeDocumentId: null }, { merge: true });
    }
    
    await deleteDoc(docRef);
    console.log(`[Firebase] Document ${docId} removed successfully.`);
  } catch (error) {
    console.error(`[Firebase] Error removing document ${docId}: `, error);
    throw error;
  }
}

/**
 * Bulk removes multiple documents.
 */
export async function removeDocuments(docIds: string[]): Promise<void> {
  console.log(`[Firebase] removeDocuments started for ${docIds.length} items.`);
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
      console.log(`[Firebase] Clearing activeDocumentId as it was in the bulk delete list.`);
      await setDoc(doc(db, "users", USER_ID), { activeDocumentId: null }, { merge: true });
    }
    
    console.log(`[Firebase] All ${docIds.length} documents removed successfully.`);
  } catch (error) {
    console.error("[Firebase] Error in bulk removal: ", error);
    throw error;
  }
}

