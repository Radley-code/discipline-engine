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
import { saveDailyLog } from "../../services/dataService";
import { auth, db } from "../../services/firebaseConfig";

interface Activity {
  key: string;
  label: string;
  streak?: number;
  startTime: number; // hour in 24h format
  endTime: number; // hour in 24h format
}

const items: Activity[] = [
  { key: "morningPrayer", label: "Morning Prayer", streak: 1, startTime: 5, endTime: 22 }, // 5AM-10PM
  { key: "workout", label: "Workout", streak: 5, startTime: 6, endTime: 9 }, // 6-9 AM
  { key: "deepWork", label: "Deep Work", streak: 1, startTime: 9, endTime: 22 }, // 9AM-10PM
  { key: "tradingSession", label: "Trading Session", streak: 7, startTime: 8, endTime: 22 }, // 8AM-10PM
  { key: "reading", label: "Reading", streak: 1, startTime: 17, endTime: 19 }, // 5-7 PM
  { key: "journaling", label: "Journaling", streak: 20, startTime: 20, endTime: 22 }, // 8-10 PM
  { key: "meditation", label: "Meditation", streak: 1, startTime: 0, endTime: 24 }, // anytime
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
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({ light: '#F5F5F5', dark: '#222427' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#111' }, 'icon');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const isActivityAvailable = (activity: Activity): boolean => {
    if (activity.startTime === 0 && activity.endTime === 24) return true; // anytime
    return currentHour >= activity.startTime && currentHour < activity.endTime;
  };

  const formatTimeWindow = (startTime: number, endTime: number): string => {
    if (startTime === 0 && endTime === 24) return 'Anytime';
    const format = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:00 ${period}`;
    };
    return `${format(startTime)} - ${format(endTime)}`;
  };

  useEffect(() => {
    let mounted = true;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Fetch profile
    const fetchProfile = async () => {
      try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (mounted && snap.exists()) {
          const data = snap.data() as any;
          if (data?.name) setDisplayName(String(data.name));
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };

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
    };
  }, []);

  const completed = Object.values(states).filter(Boolean).length;
  const progress = Math.round((completed / items.length) * 100);

  const toggle = (k: string) => {
    const activity = items.find(a => a.key === k);
    if (activity && !isActivityAvailable(activity)) {
      return; // Don't allow toggle if outside time window
    }
    setStates((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setSaving(true);
    try {
      const dateId = new Date().toISOString().split("T")[0];
      await saveDailyLog(uid, dateId, states);
      // Don't reset states after save - keep them as they are
      alert("Progress saved");
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save progress");
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
          const isAvailable = isActivityAvailable(it);
          const isChecked = states[it.key];
          
          return (
            <View key={it.key} style={[styles.card, { backgroundColor: cardBackground }]}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardLabel, { color: textColor }]}>{it.label}</Text>
                <Text style={[styles.timeWindow, { color: iconColor }]}>
                  {formatTimeWindow(it.startTime, it.endTime)}
                </Text>
                {typeof it.streak === "number" ? (
                  <View style={[styles.badge, { backgroundColor: iconColor }]}>
                    <Text style={[styles.badgeText, { color: tintColor }]}>🔥{it.streak}</Text>
                  </View>
                ) : null}
                {!isAvailable && (
                  <Text style={[styles.lockedText, { color: iconColor }]}>
                    🔒 {currentHour < it.startTime ? 'Not available yet' : 'Time window closed'}
                  </Text>
                )}
              </View>
              <View style={styles.switchContainer}>
                {isAvailable ? (
                  <Switch
                    trackColor={{ true: tintColor, false: iconColor }}
                    thumbColor={isChecked ? textColor : iconColor}
                    value={isChecked}
                    onValueChange={() => toggle(it.key)}
                  />
                ) : (
                  <View style={[styles.lockedSwitch, { borderColor: iconColor }]}>
                    <Text style={[styles.lockIcon, { color: iconColor }]}>🔒</Text>
                  </View>
                )}
              </View>
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
  cardLeft: { flexDirection: "column", alignItems: "flex-start", flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: "600" },
  timeWindow: { fontSize: 12, marginTop: 2 },
  lockedText: { fontSize: 11, marginTop: 4, fontStyle: "italic" },
  switchContainer: { marginLeft: 12 },
  lockedSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: { fontSize: 16 },
  badge: {
    marginLeft: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
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
