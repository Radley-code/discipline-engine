import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { Colors } from "../../constants/theme";
import { saveDailyLog } from "../../services/dataService";
import { auth, db } from "../../services/firebaseConfig";

const items = [
  { key: "morningPrayer", label: "Morning Prayer", streak: 12 },
  { key: "workout", label: "Workout", streak: 5 },
  { key: "deepWork", label: "Deep Work" },
  { key: "tradingSession", label: "Trading Session", streak: 7 },
  { key: "reading", label: "Reading" },
  { key: "journaling", label: "Journaling", streak: 20 },
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

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
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
    fetchProfile();
    return () => {
      mounted = false;
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
    try {
      const dateId = new Date().toISOString().split("T")[0];
      await saveDailyLog(uid, dateId, states);
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
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Daily Checklist</Text>
          <Text style={styles.greeting}>
            Welcome{displayName ? `, ${displayName}` : ""} 👋
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} style={{ flex: 1 }}>
        <View style={styles.progressWrap}>
          <CircularProgress progress={progress} size={160} strokeWidth={12} />
        </View>

        {items.map((it) => (
          <View key={it.key} style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardLabel}>{it.label}</Text>
              {typeof it.streak === "number" ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔥{it.streak}</Text>
                </View>
              ) : null}
            </View>
            <Switch
              trackColor={{ true: "#F4C542", false: "#8A8A8A" }}
              thumbColor={states[it.key] ? "#FFF" : "#EEE"}
              value={!!states[it.key]}
              onValueChange={() => toggle(it.key)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving ? { opacity: 0.9 } : undefined]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
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
            <ActivityIndicator color="#F4C542" />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    height: 72,
    paddingHorizontal: 12,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#111",
  },
  back: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700", marginTop: 13 },
  greeting: { color: "#ECEDEE", fontSize: 14, marginTop: 6, opacity: 0.95 },
  content: { padding: 20, paddingBottom: 40 },
  progressWrap: { alignItems: "center", marginVertical: 18 },
  card: {
    backgroundColor: "#222427",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "center" },
  cardLabel: { color: "#ECEDEE", fontSize: 16, fontWeight: "600" },
  badge: {
    backgroundColor: "#1F1F1F",
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: "#F4C542", fontWeight: "700" },
  saveButton: {
    backgroundColor: "#F4C542",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  saveText: { color: "#000", fontWeight: "800", fontSize: 16 },
  logoutButton: { marginTop: 10, alignItems: "center" },
  logoutText: { color: "#F4C542", fontWeight: "700" },
});
