import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColor } from "../../hooks/use-theme-color";

export default function JournalTab() {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.page, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Journal</Text>
      <Text style={[styles.subtitle, { color: iconColor }]}>Write and reflect here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { marginTop: 8 },
});
