import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { saveDailyLog } from "../../services/dataService";
import { auth } from "../../services/firebaseConfig";

interface Activity {
  key: keyof Blocks;
  label: string;
  startTime: number; // hour in 24h format
  endTime: number; // hour in 24h format
}

const activities: Activity[] = [
  { key: 'morningPrayer', label: 'Morning Prayer', startTime: 5, endTime: 7 },
  { key: 'workout', label: 'Workout', startTime: 6, endTime: 9 },
  { key: 'deepWork', label: 'Deep Work', startTime: 9, endTime: 12 },
  { key: 'reading', label: 'Reading', startTime: 17, endTime: 19 }, // 5-7 PM
  { key: 'journaling', label: 'Journaling', startTime: 20, endTime: 22 }, // 8-10 PM
];

type Blocks = {
  morningPrayer: boolean;
  workout: boolean;
  deepWork: boolean;
  reading: boolean;
  journaling: boolean;
  meditation: boolean;
};

const initialBlocks: Blocks = {
  morningPrayer: false,
  workout: false,
  deepWork: false,
  reading: false,
  journaling: false,
  meditation: false,
};

const ChecklistScreen = () => {
  const [blocks, setBlocks] = useState<Blocks>(initialBlocks);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Dark theme colors only
  const backgroundColor = '#000000';
  const textColor = '#FFFFFF';
  const tintColor = '#FFD700';
  const iconColor = '#CCCCCC';
  const cardBackground = '#1A1A1A';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const isActivityAvailable = (activity: Activity): boolean => {
    return currentHour >= activity.startTime && currentHour < activity.endTime;
  };

  const formatTimeWindow = (startTime: number, endTime: number): string => {
    const format = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:00 ${period}`;
    };
    return `${format(startTime)} - ${format(endTime)}`;
  };

  const handleToggle = (key: keyof Blocks) => {
    const activity = activities.find(a => a.key === key);
    if (activity && !isActivityAvailable(activity)) {
      return; // Don't allow toggle if outside time window
    }
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
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: tintColor }]}>Discipline Score: {score}%</Text>
      <Text style={[styles.currentTime, { color: iconColor }]}>
        Current Time: {new Date().toLocaleTimeString()}
      </Text>
      
      {/* Time-locked activities */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Time-Locked Activities</Text>
        {activities.map((activity) => {
          const isAvailable = isActivityAvailable(activity);
          const isChecked = blocks[activity.key];
          
          return (
            <View key={activity.key} style={[styles.blockRow, { backgroundColor: cardBackground }]}>
              <View style={styles.activityInfo}>
                <Text style={[styles.blockText, { color: textColor }]}>{activity.label}</Text>
                <Text style={[styles.timeWindow, { color: iconColor }]}>
                  {formatTimeWindow(activity.startTime, activity.endTime)}
                </Text>
                {!isAvailable && (
                  <Text style={[styles.lockedText, { color: iconColor }]}>
                    🔒 {currentHour < activity.startTime ? 'Not available yet' : 'Time window closed'}
                  </Text>
                )}
              </View>
              <View style={styles.switchContainer}>
                {isAvailable ? (
                  <Switch
                    value={isChecked}
                    onValueChange={() => handleToggle(activity.key)}
                    trackColor={{ true: tintColor, false: iconColor }}
                    thumbColor={isChecked ? textColor : iconColor}
                  />
                ) : (
                  <View style={[styles.lockedSwitch, { borderColor: iconColor }]}>
                    <Text style={[styles.lockIcon, { color: iconColor }]}>🔒</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Other activities */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Other Activities</Text>
        {Object.entries(blocks)
          .filter(([key]) => !activities.some(a => a.key === key))
          .map(([key, value]) => (
            <View key={key} style={[styles.blockRow, { backgroundColor: cardBackground }]}>
              <Text style={[styles.blockText, { color: textColor }]}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Switch
                value={value}
                onValueChange={() => handleToggle(key as keyof Blocks)}
                trackColor={{ true: tintColor, false: iconColor }}
                thumbColor={value ? textColor : iconColor}
              />
            </View>
          ))}
      </View>
      
      <TouchableOpacity 
        style={[styles.saveButton, { backgroundColor: tintColor }]} 
        onPress={handleSave}
      >
        <Text style={[styles.saveButtonText, { color: backgroundColor }]}>Save Progress</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  currentTime: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  blockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityInfo: { flex: 1 },
  blockText: { fontSize: 16, fontWeight: "500" },
  timeWindow: { fontSize: 12, marginTop: 2 },
  lockedText: { fontSize: 11, marginTop: 4, fontStyle: "italic" },
  switchContainer: { marginLeft: 12 },
  lockedSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: { fontSize: 16 },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
});

export default ChecklistScreen;
