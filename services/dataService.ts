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

async function calculateRealStreak(userId: string, activityKey: string): Promise<number> {
  // Check consecutive days backwards from today
  let streak = 0;
  let currentDate = new Date();
  
  for (let i = 0; i < 365; i++) { // Check up to a year back
    const dateId = currentDate.toISOString().split("T")[0];
    const logRef = doc(db, `users/${userId}/dailyLogs/${dateId}`);
    const logSnap = await getDoc(logRef);
    
    if (logSnap.exists()) {
      const data = logSnap.data();
      const blocks = data.blocks || {};
      
      if (blocks[activityKey] === true) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Check previous day
      } else {
        // Break in streak - stop counting
        break;
      }
    } else {
      // No log for this day - break streak
      break;
    }
  }
  
  return streak;
}

async function updateActivityStreaks(userId: string, blocks: Record<string, boolean>, dateId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const newStreaks: Record<string, number> = {};
  
  // Calculate real streak for each activity by checking consecutive days
  for (const activityKey of Object.keys(blocks)) {
    if (blocks[activityKey] === true) {
      // Only recalculate if activity was completed today
      newStreaks[activityKey] = await calculateRealStreak(userId, activityKey);
    } else {
      // Keep existing streak if activity not completed today
      const currentStreaks = userSnap.data()?.streaks || {};
      newStreaks[activityKey] = currentStreaks[activityKey] || 0;
    }
  }
  
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
