import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  setDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseConfig";

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
    
    // Set this doc as the active one for the user
    await setDoc(doc(db, "users", USER_ID), { activeDocumentId: docRef.id }, { merge: true });
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving document: ", error);
    throw error;
  }
}

/**
 * Fetches the currently active document ID for the user.
 */
export async function getActiveDocumentId(): Promise<string | null> {
  try {
    const userRef = doc(db, "users", USER_ID);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().activeDocumentId || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching active doc ID: ", error);
    return null;
  }
}

/**
 * Retrieves the full study document based on its ID.
 */
export async function getDocumentById(docId: string): Promise<StudyDocument | null> {
  try {
    const docRef = doc(db, "users", USER_ID, "documents", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as StudyDocument;
    }
    return null;
  } catch (error) {
    console.error("Error fetching document: ", error);
    return null;
  }
}

/**
 * Lists all documents for the current user, ordered by upload time.
 */
export async function listUserDocuments(): Promise<StudyDocument[]> {
  try {
    const userDocsRef = collection(db, "users", USER_ID, "documents");
    const q = query(userDocsRef, orderBy("uploadedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyDocument));
  } catch (error) {
    console.error("Error listing documents: ", error);
    return [];
  }
}
