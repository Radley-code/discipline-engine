import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function saveDailyLog(userId: string, dateId: string, blocks: Record<string, boolean>) {
  const completedCount = Object.values(blocks).filter(Boolean).length;
  const totalBlocks = Object.keys(blocks).length;
  const score = Math.round((completedCount / totalBlocks) * 100);

  const logRef = doc(db, `users/${userId}/dailyLogs/${dateId}`);
  await setDoc(logRef, {
    date: dateId,
    blocks,
    completedCount,
    totalBlocks,
    score,
    createdAt: new Date().toISOString(),
  });
}
