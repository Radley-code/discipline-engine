import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function saveDailyLog(userId: string, dateId: string, blocks: Record<string, boolean>) {
  const completedCount = Object.values(blocks).filter(Boolean).length;
  const totalBlocks = Object.keys(blocks).length;
  const score = Math.round((completedCount / totalBlocks) * 100);

  // Update streaks for each activity
  await updateActivityStreaks(userId, blocks, dateId);

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

async function updateActivityStreaks(userId: string, blocks: Record<string, boolean>, dateId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data();
  const currentStreaks = userData.streaks || {};
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayId = yesterday.toISOString().split("T")[0];
  
  // Get yesterday's log to check if streak continues
  const yesterdayLogRef = doc(db, `users/${userId}/dailyLogs/${yesterdayId}`);
  const yesterdaySnap = await getDoc(yesterdayLogRef);
  const yesterdayBlocks = yesterdaySnap.exists() ? yesterdaySnap.data().blocks : {};
  
  const newStreaks = { ...currentStreaks };
  
  // Update streak for each activity
  Object.keys(blocks).forEach(activityKey => {
    const isCompletedToday = blocks[activityKey];
    const wasCompletedYesterday = yesterdayBlocks[activityKey] || false;
    
    if (isCompletedToday) {
      if (wasCompletedYesterday) {
        // Continue streak
        newStreaks[activityKey] = (currentStreaks[activityKey] || 0) + 1;
      } else {
        // Start new streak
        newStreaks[activityKey] = 1;
      }
    } else {
      // Reset streak if not completed today
      newStreaks[activityKey] = 0;
    }
  });
  
  // Save updated streaks to user profile
  await setDoc(userRef, { streaks: newStreaks }, { merge: true });
}

export async function getActivityStreaks(userId: string): Promise<Record<string, number>> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return {};
  
  const userData = userSnap.data();
  return userData.streaks || {};
}
