import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    LayoutChangeEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { useThemeColor } from "../../hooks/use-theme-color";
import { auth, db } from "../../services/firebaseConfig";

export default function StatsScreen() {
  const [data, setData] = useState<
    { value: number; label: string; frontColor: string }[]
  >([]);
  const [streak, setStreak] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    label?: string;
    value?: number;
  }>({ visible: false, x: 0, y: 0 });
  const [currentWeekRange, setCurrentWeekRange] = useState<string>("");
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [percentPositive, setPercentPositive] = useState<boolean>(true);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({ light: '#F5F5F5', dark: '#141416' }, 'background');
  const buttonBackground = useThemeColor({ light: '#E8E8E8', dark: '#222428' }, 'icon');
  const errorColor = useThemeColor({ light: '#FF6B6B', dark: '#FF6B6B' }, 'tint');

  const anim = useRef(new Animated.Value(0)).current;
  // trigger animation when `data` changes
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
    return () => anim.setValue(0);
  }, [anim, data]);

  useEffect(() => {
    let mounted = true;

    const fetchLogsForUid = async (uid: string) => {
      try {
        const snapshot = await getDocs(
          collection(db, "users", uid, "dailyLogs")
        );
        const logs: { date: string; value: number }[] = [];
        const blockCounts = new Map<string, number>();

        snapshot.forEach((doc) => {
          const log = doc.data() as Record<string, any>;

          // Robustly count boolean true values, including nested objects (blocks)
          const flattenValues = (v: any): any[] => {
            if (v == null) return [];
            if (typeof v === "object")
              return Object.values(v).flatMap(flattenValues);
            return [v];
          };

          const allValues = Object.values(log).flatMap(flattenValues);
          const completedCount = allValues.filter((v) => v === true).length;
          logs.push({ date: doc.id, value: completedCount });

          // tally block counts per key for block consistency
          Object.entries(log).forEach(([k, v]) => {
            if (typeof v === "boolean") {
              if (v === true) blockCounts.set(k, (blockCounts.get(k) ?? 0) + 1);
            } else if (typeof v === "object" && v != null) {
              // count nested trues
              Object.values(v).forEach((nv) => {
                if (nv === true)
                  blockCounts.set(k, (blockCounts.get(k) ?? 0) + 1);
              });
            }
          });
        });

        // Build a map for quick lookup
        const logsByDate = new Map(logs.map((l) => [l.date, l.value]));

        // Helper to format YYYY-MM-DD
        const isoDate = (d: Date) => d.toISOString().split("T")[0];

        // Last 7 calendar days (oldest -> newest)
        const lastNDates = (n: number) => {
          const out: string[] = [];
          for (let i = n - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            out.push(isoDate(d));
          }
          return out;
        };

        const labels = lastNDates(7);
        const chartData = labels.map((dateId) => ({
          value: logsByDate.get(dateId) ?? 0,
          label: dateId.slice(5),
          frontColor: tintColor,
        }));

        // Compute consecutive-day streak from today backward
        let s = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const id = isoDate(d);
          if ((logsByDate.get(id) ?? 0) > 0) s += 1;
          else break;
        }

        // Compute week-over-week percent using last 14 calendar days
        const last14 = lastNDates(14); // oldest->newest
        const last7 = last14.slice(7);
        const prev7 = last14.slice(0, 7);
        const sum = (arr: string[]) =>
          arr.reduce((acc, id) => acc + (logsByDate.get(id) ?? 0), 0);
        const prevSum = sum(prev7);
        const currSum = sum(last7);
        let pct: number | null = null;
        if (prevSum === 0) {
          pct = currSum === 0 ? 0 : null; // null = new activity (can't compute percent)
        } else {
          pct = Math.round(((currSum - prevSum) / prevSum) * 100);
        }

        const formatRange = (arr: string[]) => {
          const a = new Date(arr[0]);
          const b = new Date(arr[arr.length - 1]);
          const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
          return `${fmt(a)} - ${fmt(b)}`;
        };

        if (mounted) {
          setCurrentWeekRange(formatRange(last7));
          setPercentChange(pct);
          setPercentPositive((pct ?? 0) >= 0);
        }

        if (mounted) {
          setData(chartData);
          setStreak(s);
        }

        // prepare block consistency data (top 6 blocks)
        const blocksArr = Array.from(blockCounts.entries())
          .map(([k, v]) => ({ key: k, count: v }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        // expose block chart via a small local state stored in data variable tail? Instead keep as memo below via closure.
        // store block info on window for retrieval in render (quick approach)
        (global as any).__blockConsistency = blocksArr;
      } catch (e) {
        console.error("Failed to load dailyLogs", e);
        if (mounted) setData([]);
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.uid) fetchLogsForUid(user.uid);
      else setData([]);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Performance Overview card */}
      <View style={[styles.cardBig, { backgroundColor: cardBackground }]}>
        <Text style={[styles.cardSmallTitle, { color: textColor }]}>Performance Overview</Text>
        <View style={styles.performanceRow}>
          <Text
            style={[
              styles.performanceValue,
              percentPositive ? { color: tintColor } : { color: errorColor },
            ]}
          >
            {percentChange === null
              ? "New"
              : `${percentChange >= 0 ? "+" : ""}${percentChange}%`}
          </Text>
          <Text style={[styles.performanceSub, { color: iconColor }]}>Compared to last week</Text>
        </View>
        <View style={styles.rangeRow}>
          <Text style={[styles.rangeNav, { color: textColor }]}>‹</Text>
          <Text style={[styles.rangeText, { color: textColor }]}>{currentWeekRange || "--"}</Text>
          <Text style={[styles.rangeNav, { color: textColor }]}>›</Text>
        </View>
        <View style={[styles.rangeButton, { backgroundColor: buttonBackground }]}>
          <Text style={[styles.rangeButtonText, { color: textColor }]}>Current Week</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: textColor }]}>Your Weekly Progress</Text>
      <Text style={[styles.streak, { color: textColor }]}>🔥 Current Streak: {streak} days</Text>

      <View
        style={styles.chartContainer}
        onLayout={(e: LayoutChangeEvent) =>
          setContainerWidth(e.nativeEvent.layout.width)
        }
      >
        <Animated.View
          style={{
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          <LineChart
            data={data.map((d) => ({ value: d.value, label: d.label }))}
            height={180}
            curved
            areaChart
            initialSpacing={12}
            spacing={20}
            hideRules
            yAxisThickness={0}
            xAxisLabelTextStyle={{ color: textColor }}
            yAxisTextStyle={{ color: textColor }}
            color={tintColor}
            maxValue={Math.max(7, ...data.map((d) => d.value))}
          />

          {/* average line overlay */}
          {containerWidth > 0 && data.length > 0
            ? (() => {
                const chartHeight = 180; // matches BarChart height
                const maxVal = Math.max(7, ...data.map((d) => d.value));
                const avg = Math.round(
                  data.reduce((s, d) => s + d.value, 0) / data.length
                );
                const yPos = (1 - avg / maxVal) * chartHeight;
                return (
                  <View
                    pointerEvents="none"
                    style={[styles.avgLineWrap, { height: chartHeight }]}
                  >
                    <View style={[styles.avgLine, { top: yPos }]}>
                      <Text style={[styles.avgLabel, { color: textColor }]}>avg {avg}</Text>
                    </View>
                  </View>
                );
              })()
            : null}

          {/* touch overlays for tooltips */}
          {containerWidth > 0 &&
            data.length > 0 &&
            (() => {
              const barWidth = 30;
              const spacing = 20;
              const totalWidth =
                data.length * barWidth + Math.max(0, data.length - 1) * spacing;
              const startX = Math.max(0, (containerWidth - totalWidth) / 2);
              const maxVal = Math.max(7, ...data.map((d) => d.value));
              return (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                  {data.map((d, i) => {
                    const left = startX + i * (barWidth + spacing);
                    const top = (1 - d.value / maxVal) * 180;
                    return (
                      <TouchableOpacity
                        key={i}
                        activeOpacity={0.8}
                        onPress={() =>
                          setTooltip({
                            visible: true,
                            x: left + barWidth / 2,
                            y: top,
                            label: d.label,
                            value: d.value,
                          })
                        }
                        style={{
                          position: "absolute",
                          left,
                          top: 0,
                          width: barWidth,
                          height: 180,
                        }}
                      />
                    );
                  })}
                </View>
              );
            })()}

          {/* tooltip */}
          {tooltip.visible ? (
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.max(
                    8,
                    Math.min(containerWidth - 140, tooltip.x - 70)
                  ),
                  top: tooltip.y - 36,
                },
              ]}
            >
              <Text style={[styles.tooltipText, { color: textColor }]}>{tooltip.label}</Text>
              <Text style={[styles.tooltipValue, { color: tintColor }]}>{tooltip.value}</Text>
              <TouchableOpacity
                onPress={() => setTooltip({ visible: false, x: 0, y: 0 })}
              >
                <Text style={[styles.tooltipClose, { color: iconColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Animated.View>
      </View>

      {/* Block Consistency card */}
      <View style={[styles.cardBig, { backgroundColor: cardBackground }]}>
        <Text style={[styles.cardSmallTitle, { color: textColor }]}>Block Consistency</Text>
        <Text style={[styles.cardSubtitle, { color: iconColor }]}>
          Performance per discipline block
        </Text>
        <View style={{ height: 160, marginTop: 12 }}>
          {/* render a small bar chart for blockConsistency using global stored blocks */}
          {((global as any).__blockConsistency ?? []).length === 0 ? (
            <Text style={{ color: iconColor, textAlign: "center", marginTop: 30 }}>
              No block data yet
            </Text>
          ) : (
            <BarChart
              data={((global as any).__blockConsistency ?? []).map(
                (b: any) => ({
                  value: b.count,
                  label: b.key,
                  frontColor: "#7B61FF",
                })
              )}
              barWidth={24}
              spacing={18}
              roundedTop
              hideRules
              yAxisThickness={0}
              xAxisLabelTextStyle={{ color: textColor }}
              yAxisTextStyle={{ color: textColor }}
              frontColor={tintColor}
              maxValue={Math.max(
                1,
                ...((global as any).__blockConsistency ?? []).map(
                  (b: any) => b.count
                )
              )}
              height={140}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    marginTop: 25,
    textAlign: "center",
  },
  cardBig: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardSmallTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  performanceValue: { fontSize: 28, fontWeight: "800" },
  performanceSub: { fontSize: 12, marginLeft: 12 },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  rangeNav: { fontSize: 20, paddingHorizontal: 12 },
  rangeText: { fontSize: 14 },
  rangeButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  rangeButtonText: { fontWeight: "700" },
  chartContainer: {
    height: 220,
    marginTop: 10,
    marginBottom: 24,
    justifyContent: "center",
  },
  streak: { fontSize: 16, marginTop: 10, textAlign: "center" },
  avgLineWrap: { position: "absolute", left: 0, right: 0, top: 0 },
  avgLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(244,197,66,0.6)",
    alignItems: "flex-end",
    paddingRight: 8,
  },
  avgLabel: {
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardSubtitle: { fontSize: 12, marginTop: 6 },
  tooltip: {
    position: "absolute",
    width: 140,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  tooltipText: { fontSize: 12 },
  tooltipValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  tooltipClose: { marginTop: 6 },
});
