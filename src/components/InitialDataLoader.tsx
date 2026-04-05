import React, { useEffect } from 'react';
import { useStore } from '../store/store';
import { getUserQuizAttempts, getExamDate } from '../services/firebaseService';

/**
 * Headless component that hydrates the global store with Firebase data 
 * on initial application boot.
 */
export const InitialDataLoader: React.FC = () => {
  const setAllAttempts = useStore((s) => s.setAllAttempts);
  const setExamDate = useStore((s) => s.setExamDate);
  const setDaysLeft = useStore((s) => s.setDaysLeft);
  const setInitialLoadComplete = useStore((s) => s.setInitialLoadComplete);

  const calculateDaysLeft = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const hydrate = async () => {
      console.group("[InitialDataLoader] Hydrating Store from Firebase");
      try {
        // 1. Fetch History
        const attempts = await getUserQuizAttempts();
        setAllAttempts(attempts);

        // 2. Fetch Exam Date
        const dateStr = await getExamDate();
        if (dateStr) {
          setExamDate(dateStr);
          setDaysLeft(calculateDaysLeft(dateStr));
          console.log(`Exam Date Sync: ${dateStr}`);
        }

        setInitialLoadComplete(true);
        console.log("Initial Load Success.");
      } catch (err) {
        console.error("Hydration failed:", err);
      } finally {
        console.groupEnd();
      }
    };

    hydrate();
  }, [setAllAttempts, setExamDate, setDaysLeft, setInitialLoadComplete]);

  return null; // Headless
};
