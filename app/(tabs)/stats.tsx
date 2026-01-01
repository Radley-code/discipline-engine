import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { auth, db } from "../../services/firebaseConfig";

export default function StatsScreen() {
  const [data, setData] = useState<
    { value: number; label: string; frontColor: string }[]
  >([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snapshot = await getDocs(collection(db, "users", uid, "dailyLogs"));
      const logs: { date: string; value: number }[] = [];

      snapshot.forEach((doc) => {
        const log = doc.data();
        const completedCount = Object.values(log).filter(
          (v) => v === true
        ).length;
        logs.push({ date: doc.id, value: completedCount });
      });

      // Sort by date and format for chart
      const chartData = logs
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((log) => ({
          value: log.value,
          label: log.date.slice(5), // show MM-DD
          frontColor: "#F4C542",
        }));

      setData(chartData);
    };

    fetchLogs();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Weekly Progress</Text>
      <BarChart
        data={data}
        barWidth={30}
        spacing={20}
        roundedTop
        hideRules
        yAxisThickness={0}
        xAxisLabelTextStyle={{ color: "#FFF" }}
        yAxisTextStyle={{ color: "#FFF" }}
        frontColor="#F4C542"
        maxValue={7}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0B", padding: 20 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "600", marginBottom: 20 },
});
