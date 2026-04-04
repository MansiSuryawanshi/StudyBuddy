/**
 * Firebase Firestore operations for study reports.
 * Claude API calls stay in claudeService.ts — this file is storage only.
 */
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { StudyReport } from '../types/report';

type RawFirestoreReport = Omit<StudyReport, 'id' | 'createdAt'> & {
  createdAt: Timestamp | null;
};

function toStudyReport(id: string, data: RawFirestoreReport): StudyReport {
  return {
    ...data,
    id,
    createdAt: data.createdAt?.toDate() ?? null,
  };
}

export const saveReport = async (report: StudyReport): Promise<string> => {
  const { id: _id, createdAt: _createdAt, ...rest } = report;
  const ref = await addDoc(collection(db, 'studyReports'), {
    ...rest,
    createdAt: serverTimestamp(),
    studentId: 'anonymous',
  });
  return ref.id;
};

export const getReports = async (): Promise<StudyReport[]> => {
  try {
    const q = query(
      collection(db, 'studyReports'),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toStudyReport(d.id, d.data() as RawFirestoreReport));
  } catch {
    return [];
  }
};

export const getReportById = async (id: string): Promise<StudyReport | null> => {
  const snap = await getDoc(doc(db, 'studyReports', id));
  if (!snap.exists()) return null;
  return toStudyReport(snap.id, snap.data() as RawFirestoreReport);
};
