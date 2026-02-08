import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CircularProgress from "../../components/CircularProgress";
import { useThemeColor } from "../../hooks/use-theme-color";
import { getActivityStreaks, saveDailyLog } from "../../services/dataService";
import { auth, db } from "../../services/firebaseConfig";

interface Activity {
  key: string;
  label: string;
  streak?: number;
}

const items: Activity[] = [
  { key: "morningPrayer", label: "Morning Prayer" },
  { key: "workout", label: "Workout" },
  { key: "deepWork", label: "Deep Work" },
  { key: "tradingSession", label: "Trading Session" },
  { key: "reading", label: "Reading" },
  { key: "journaling", label: "Journaling" },
  { key: "meditation", label: "Meditation" },
];

export default function HomeTab() {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.key, false]))
  );
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [activityStreaks, setActivityStreaks] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({ light: '#F5F5F5', dark: '#222427' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#111' }, 'icon');

  useEffect(() => {
    let mounted = true;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Monitor connection status
    const checkConnection = async () => {
      try {
        // Test connection with a simple read
        await getDoc(doc(db, "users", uid));
        if (mounted) {
          setIsOnline(true);
          setConnectionError(null);
        }
      } catch (error: any) {
        if (mounted) {
          setIsOnline(false);
          if (error.message.includes('offline')) {
            setConnectionError('Offline mode - changes will sync when connection is restored');
          } else {
            setConnectionError('Connection issue - please check your internet');
          }
        }
      }
    };

    // Initial connection check
    checkConnection();

    // Set up periodic connection checks
    const connectionInterval = setInterval(checkConnection, 30000); // Check every 30 seconds

    // Fetch profile with error handling
    const fetchProfile = async () => {
      try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (mounted && snap.exists()) {
          const data = snap.data();
          setDisplayName(data.name || null);
          
          // Fetch activity streaks
          try {
            const streaks = await getActivityStreaks(uid);
            if (mounted) {
              setActivityStreaks(streaks);
              setIsOnline(true);
              setConnectionError(null);
            }
          } catch (streakError) {
            console.warn("Could not fetch streaks, using cached data:", streakError);
            // Continue with existing streaks
          }
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        if (err.message.includes('offline')) {
          if (mounted) {
            setIsOnline(false);
            setConnectionError('Offline mode - working with cached data');
          }
        }
      }
    };

    fetchProfile();

    // Fetch today's daily log
    const fetchTodayLog = async () => {
      try {
        const dateId = new Date().toISOString().split("T")[0];
        const docSnap = await getDoc(doc(db, "users", uid, "dailyLogs", dateId));
        if (mounted && docSnap.exists()) {
          const data = docSnap.data();
          // Load saved states
          const savedStates: Record<string, boolean> = {};
          items.forEach(item => {
            savedStates[item.key] = data[item.key] || false;
          });
          setStates(savedStates);
        }
      } catch (err) {
        console.error("Failed to fetch today's log", err);
      }
    };

    // Set up real-time listener for today's daily log
    const dateId = new Date().toISOString().split("T")[0];
    const unsubscribeLog = onSnapshot(doc(db, "users", uid, "dailyLogs", dateId), (docSnapshot) => {
      if (mounted && docSnapshot.exists()) {
        const data = docSnapshot.data();
        const savedStates: Record<string, boolean> = {};
        items.forEach(item => {
          savedStates[item.key] = data[item.key] || false;
        });
        setStates(savedStates);
      }
    }, (error) => {
      console.error("Error listening to daily log changes:", error);
    });

    fetchProfile();
    fetchTodayLog();

    // fetch streak (consecutive days) from dailyLogs
    const fetchStreak = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "users", uid, "dailyLogs")
        );
        const logsByDate = new Map<string, number>();
        snapshot.forEach((d) => {
          const data = d.data() as Record<string, any>;
          // count trues in doc (flatten)
          const flatten = (v: any): any[] => {
            if (v == null) return [];
            if (typeof v === "object") return Object.values(v).flatMap(flatten);
            return [v];
          };
          const all = Object.values(data).flatMap(flatten);
          const c = all.filter((x) => x === true).length;
          logsByDate.set(d.id, c);
        });

        const isoDate = (d: Date) => d.toISOString().split("T")[0];
        let s = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const id = isoDate(d);
          if ((logsByDate.get(id) ?? 0) > 0) s += 1;
          else break;
        }
        if (mounted) setStreakCount(s);
      } catch (err) {
        console.error("Failed to fetch streak", err);
      }
    };
    fetchStreak();

    return () => {
      mounted = false;
      unsubscribeLog();
      clearInterval(connectionInterval);
    };
  }, []);

  const completed = Object.values(states).filter(Boolean).length;
  const progress = Math.round((completed / items.length) * 100);

  const toggle = (k: string) =>
    setStates((prev) => ({ ...prev, [k]: !prev[k] }));

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setSaving(true);
    setConnectionError(null);
    
    try {
      const dateId = new Date().toISOString().split("T")[0];
      await saveDailyLog(uid, dateId, states);
      
      // Refresh streaks immediately after save
      try {
        const updatedStreaks = await getActivityStreaks(uid);
        setActivityStreaks(updatedStreaks);
        setIsOnline(true);
        setConnectionError(null);
        alert("Progress saved successfully!");
      } catch (streakError) {
        console.warn("Streaks will update when connection is restored");
        alert("Progress saved locally - will sync when online");
      }
    } catch (err: any) {
      console.error("Save error", err);
      if (err.message.includes('offline')) {
        setConnectionError('Offline mode - progress saved locally, will sync when online');
        alert("Offline mode: Progress saved locally and will sync when connection is restored");
      } else {
        setConnectionError('Failed to save - please try again');
        alert("Failed to save progress. Please check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      router.replace("/screens/LoginScreen");
      setLogoutLoading(false);
    }
  };

  return (
    <View style={[styles.page, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Daily Checklist</Text>
          <Text style={[styles.greeting, { color: iconColor }]}>
            Welcome{displayName ? `, ${displayName}` : ""} 👋
          </Text>
          {/* Connection Status Indicator */}
          {connectionError && (
            <View style={styles.connectionStatus}>
              <Text style={[styles.connectionText, { color: isOnline ? '#4CAF50' : '#FF9800' }]}>
                {isOnline ? '🟢 Online' : '🟡 ' + connectionError}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} style={{ flex: 1 }}>
        <View style={styles.progressWrap}>
          <CircularProgress progress={progress} size={160} strokeWidth={12} />
          <View style={styles.streakBadge}>
            <Text style={[styles.streakBadgeText, { color: tintColor }]}>🔥{streakCount}</Text>
          </View>
        </View>

        {items.map((it) => {
          const isChecked = states[it.key];
          const currentStreak = activityStreaks[it.key] || 0;
          
          return (
            <View key={it.key} style={[styles.card, { backgroundColor: cardBackground }]}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardLabel, { color: textColor }]}>{it.label}</Text>
                {currentStreak > 0 ? (
                  <View style={[styles.badge, { backgroundColor: iconColor }]}>
                    <Text style={[styles.badgeText, { color: tintColor }]}>🔥{currentStreak}</Text>
                  </View>
                ) : null}
              </View>
              <Switch
                trackColor={{ true: tintColor, false: iconColor }}
                thumbColor={isChecked ? textColor : iconColor}
                value={isChecked}
                onValueChange={() => toggle(it.key)}
              />
            </View>
          );
        })}

        <TouchableOpacity
          style={[
            styles.saveButton, 
            { backgroundColor: '#FFD700' }, 
            saving ? { opacity: 0.7 } : undefined,
            !saving && { shadowColor: '#FFD700', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={[styles.saveText, { color: '#000000' }]}>Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            logoutLoading ? { opacity: 0.9 } : undefined,
          ]}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator color={tintColor} />
          ) : (
            <Text style={[styles.logoutText, { color: iconColor }]}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20 },
  header: {
    height: 72,
    paddingHorizontal: 12,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  back: { width: 36, alignItems: "flex-start" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 13,
  },
  greeting: { fontSize: 14, marginTop: 6, opacity: 0.95 },
  connectionStatus: { marginTop: 8, alignItems: "center" },
  connectionText: { fontSize: 11, fontStyle: "italic" },
  content: { padding: 20, paddingBottom: 40 },
  progressWrap: { alignItems: "center", marginVertical: 18 },
  card: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: "600" },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontWeight: "700" },
  streakBadge: { marginTop: 10, alignItems: "center" },
  streakBadgeText: { fontWeight: "800" },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  saveText: { fontWeight: "800", fontSize: 16 },
  logoutButton: { marginTop: 10, alignItems: "center" },
  logoutText: { fontWeight: "700" },
});
