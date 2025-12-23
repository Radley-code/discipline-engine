import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../services/firebaseConfig";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // name/referral can be stored later; for now we just create the account
      router.replace("/screens/ChecklistScreen");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.topContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        />
        <Text style={styles.titleTop}>Forge Your Future</Text>
        <Text style={styles.subtitleTop}>
          Create an account to unlock your potential and master discipline.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Name"
          placeholderTextColor="#9A9A9A"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9A9A9A"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9A9A9A"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Referral Code (Optional)"
          placeholderTextColor="#9A9A9A"
          value={referral}
          onChangeText={setReferral}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSignup}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/screens/LoginScreen")}
          style={styles.bottomLink}
        >
          <Text style={styles.bottomText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0B0B" },
  topContainer: { alignItems: "center", paddingTop: 48 },
  logo: { width: 84, height: 84, borderRadius: 18, backgroundColor: "#FFF" },
  titleTop: { color: "#FFF", fontSize: 22, fontWeight: "700", marginTop: 14 },
  subtitleTop: {
    color: "#BEBEBE",
    textAlign: "center",
    marginTop: 8,
    width: "75%",
    fontSize: 13,
  },
  formContainer: { padding: 24, marginTop: 28 },
  input: {
    backgroundColor: "#1F2126",
    color: "#FFFFFF",
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "#F4C542",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  actionText: { color: "#000", fontWeight: "700", fontSize: 16 },
  bottomLink: { alignItems: "center" },
  bottomText: { color: "#CFCFCF" },
  error: { color: "#FF6B6B", marginBottom: 8 },
});
