import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CircularProgress from "../../components/CircularProgress";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { Colors } from "../../constants/theme";
import { saveDailyLog } from "../../services/dataService";
import { auth } from "../../services/firebaseConfig";

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

  const completed = Object.values(states).filter(Boolean).length;
  const progress = Math.round((completed / items.length) * 100);

  const toggle = (k: string) =>
    setStates((prev) => ({ ...prev, [k]: !prev[k] }));

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const dateId = new Date().toISOString().split("T")[0];
    await saveDailyLog(uid, dateId, states);
    alert("Progress saved");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      router.replace("/screens/LoginScreen");
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => {
            /* left icon action if needed */
          }}
        >
          <IconSymbol name="arrow.left" size={22} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Checklist</Text>
        <View style={{ width: 36 }} />
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#111",
  },
  back: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
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
