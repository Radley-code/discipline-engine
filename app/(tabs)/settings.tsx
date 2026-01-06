import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../contexts/theme-context';
import { useThemeColor } from '../../hooks/use-theme-color';
import { auth, db } from '../../services/firebaseConfig';

export default function SettingsScreen() {
  const { theme, setTheme, toggleTheme } = useThemeContext();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Initial load
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPrefs(data.notificationPrefs || {});
      }
    };

    fetchSettings();

    // Set up real-time listener for notification preferences
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setPrefs(data.notificationPrefs || {});
      }
    }, (error) => {
      console.error('Error listening to notification preferences:', error);
    });

    return () => unsubscribe();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await updateDoc(doc(db, 'users', uid), { [key]: value });
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await updateSetting('theme', newTheme);
  };

  const togglePref = (key: string) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    updateSetting('notificationPrefs', newPrefs);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/screens/LoginScreen');
  };

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Theme Section */}
      <Text style={[styles.sectionTitle, { color: tintColor }]}>Theme</Text>
      <View style={styles.row}>
        <View>
          <Text style={[styles.label, { color: textColor }]}>Dark Mode</Text>
          <Text style={[styles.subtext, { color: iconColor }]}>{theme === 'dark' ? 'Enabled' : 'Disabled'}</Text>
        </View>
        <Switch value={theme === 'dark'} onValueChange={handleThemeToggle} />
      </View>

      {/* Notifications Section */}
      <Text style={[styles.sectionTitle, { color: tintColor }]}>Notifications</Text>
      {['morningPrayer', 'workout', 'deepWork', 'reading', 'journaling'].map((key) => (
        <View key={key} style={styles.row}>
          <View>
            <Text style={[styles.label, { color: textColor }]}>{key.replace(/([A-Z])/g, ' $1')}</Text>
            <Text style={[styles.subtext, { color: iconColor }]}>
              Notifications {prefs[key] ? 'enabled' : 'disabled'} for {key.replace(/([A-Z])/g, ' $1')}
            </Text>
          </View>
          <Switch value={prefs[key]} onValueChange={() => togglePref(key)} />
        </View>
      ))}

      {/* Data Management Section */}
      <Text style={[styles.sectionTitle, { color: tintColor }]}>Data Management</Text>
      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: iconColor }]}>
        <Text style={[styles.linkText, { color: textColor }]}>Export Weekly Summary</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: iconColor }]}>
        <Text style={[styles.linkText, { color: textColor }]}>Backup Data</Text>
      </TouchableOpacity>

      {/* Account & General Section */}
      <Text style={[styles.sectionTitle, { color: tintColor }]}>Account & General</Text>
      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: iconColor }]}>
        <Text style={[styles.linkText, { color: textColor }]}>Profile Information</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: iconColor }]} onPress={() => openLink('https://yourapp.com/privacy')}>
        <Text style={[styles.linkText, { color: textColor }]}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: iconColor }]} onPress={() => openLink('https://yourapp.com/terms')}>
        <Text style={[styles.linkText, { color: textColor }]}>Terms of Service</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: iconColor }]} onPress={handleLogout}>
        <Text style={[styles.linkText, { color: textColor }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: { fontSize: 14 },
  subtext: { fontSize: 12 },
  linkRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  linkText: { fontSize: 14 },
});
