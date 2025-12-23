import React, { useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { saveDailyLog } from "../../services/dataService";
import { auth } from "../../services/firebaseConfig";

type Blocks = {
  morningPrayer: boolean;
  workout: boolean;
  deepWork: boolean;
  tradingSession: boolean;
  afternoonPrayer: boolean;
  projectBuild: boolean;
  eveningPrayer: boolean;
  syndicateReview: boolean;
  nightPrayer: boolean;
};

const initialBlocks: Blocks = {
  morningPrayer: false,
  workout: false,
  deepWork: false,
  tradingSession: false,
  afternoonPrayer: false,
  projectBuild: false,
  eveningPrayer: false,
  syndicateReview: false,
  nightPrayer: false,
};

const ChecklistScreen = () => {
  const [blocks, setBlocks] = useState<Blocks>(initialBlocks);

  const handleToggle = (key: keyof Blocks) => {
    setBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("User not logged in");
      return;
    }
    const dateId = new Date().toISOString().split("T")[0];
    try {
      await saveDailyLog(userId, dateId, blocks);
      alert("Progress saved!");
    } catch (error) {
      console.error("Error saving log:", error);
      alert("Failed to save. Check console.");
    }
  };

  const completedCount = Object.values(blocks).filter(Boolean).length;
  const total = Object.keys(blocks).length;
  const score = Math.round((completedCount / total) * 100);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Discipline Score: {score}%</Text>
      {(Object.entries(blocks) as [keyof Blocks, boolean][]).map(
        ([key, value]) => (
          <View key={String(key)} style={styles.blockRow}>
            <Text style={styles.blockText}>{String(key)}</Text>
            <Switch value={value} onValueChange={() => handleToggle(key)} />
          </View>
        )
      )}
      <Button title="Save Progress" onPress={handleSave} color="#FFD700" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0D0D0D" },
  title: { fontSize: 24, color: "#FFD700", marginBottom: 20 },
  blockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  blockText: { color: "#CCCCCC", fontSize: 18 },
});

export default ChecklistScreen;
