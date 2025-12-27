import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/theme";
import { auth } from "../../services/firebaseConfig";

export default function SettingsTab() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } finally {
      router.replace("/screens/LoginScreen");
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.signout} onPress={handleSignOut}>
        <Text style={styles.signoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.dark.background, padding: 20 },
  title: { color: "#FFF", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  signout: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
  },
  signoutText: { color: "#F4C542", fontWeight: "700" },
});
