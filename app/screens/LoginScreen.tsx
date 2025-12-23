import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        <Text style={styles.subtitle}>
          Your dedicated command center for personal growth.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#9A9A9A"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#9A9A9A"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.forgotContainer} onPress={() => {}}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.bioRow}>
          <View style={styles.fingerprintCircle}>
            <Text style={styles.fingerprintIcon}>🔒</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bottomLink}
          onPress={() => router.push("/screens/SignupScreen")}
        >
          <Text style={styles.bottomText}>
            Don&apos;t have an account?{" "}
            <Text style={styles.signUpText}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0B0B" },
  topContainer: { alignItems: "center", paddingTop: 48 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: "#FFF",
    padding: 8,
  },
  subtitle: {
    color: "#BEBEBE",
    textAlign: "center",
    marginTop: 12,
    width: "70%",
    fontSize: 13,
  },
  formContainer: { padding: 24, marginTop: 28 },
  label: { color: "#DDDDDD", marginBottom: 8, fontSize: 13 },
  input: {
    backgroundColor: "#1F2126",
    color: "#FFFFFF",
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  forgotContainer: { alignSelf: "flex-end", marginBottom: 8 },
  forgotText: { color: "#BEBEBE", fontSize: 12 },
  actionButton: {
    backgroundColor: "#F4C542",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  actionText: { color: "#000", fontWeight: "700", fontSize: 16 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  line: { flex: 1, height: 1, backgroundColor: "#2A2A2A" },
  orText: { color: "#9A9A9A", marginHorizontal: 8 },
  bioRow: { alignItems: "center", marginBottom: 20, marginTop: 8 },
  fingerprintCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
  },
  fingerprintIcon: { fontSize: 22 },
  bottomLink: { alignItems: "center", marginTop: 8 },
  bottomText: { color: "#CFCFCF" },
  signUpText: { color: "#F4C542", fontWeight: "600" },
  error: { color: "#FF6B6B", marginBottom: 8 },
});
