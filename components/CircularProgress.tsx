import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "../constants/theme";

type Props = {
  size?: number;
  progress: number; // 0-100
  strokeWidth?: number;
};

export default function CircularProgress({
  size = 160,
  progress,
  strokeWidth = 10,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = Math.max(0, Math.min(100, progress));
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#101214"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F4C542"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
        />
      </Svg>

      <View
        style={[
          styles.inner,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
          },
        ]}
      >
        <Text style={styles.percentText}>{progressPercentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
  inner: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.background,
  },
  percentText: { color: "#F4C542", fontSize: 28, fontWeight: "800" },
});
