import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";

export default function JournalTab() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.subtitle}>Write and reflect here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.dark.background, padding: 20 },
  title: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 8 },
});
