import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Provide placeholder keys for the initial integration.
// Replace with your real Firebase config from the Firebase Console.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studybuddy-dummy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studybuddy-dummy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studybuddy-dummy.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:dummy"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
