import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";
import { formatCourseCode } from "../utils/attendance";

function AttendanceProgressBar({ value }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = Math.max(0, Math.min(100, value));
  const statusColor = fill >= ATTENDANCE_THRESHOLD ? "#10B981" : "#D64560";
  const thumbLeft = trackWidth > 0
    ? Math.max(9, Math.min(trackWidth - 9, (fill / 100) * trackWidth))
    : 9;
  const thresholdLeft = trackWidth * (ATTENDANCE_THRESHOLD / 100);
  const showThresholdBubble = Math.abs(fill - ATTENDANCE_THRESHOLD) > 8;

  return (
    <View style={styles.progressWrap}>
      {showThresholdBubble && trackWidth > 0 ? (
        <View style={[styles.thresholdBubble, { left: thresholdLeft - 22 }]}>
          <Text style={styles.thresholdText}>75%</Text>
          <View style={styles.caretBorder} />
          <View style={styles.caretFill} />
        </View>
      ) : null}
      <View onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)} style={styles.track}>
        <View style={[styles.fill, { backgroundColor: statusColor, width: `${fill}%` }]} />
        {trackWidth > 0 ? <View style={[styles.thresholdNotch, { left: thresholdLeft - 1 }]} /> : null}
        {trackWidth > 0 ? <View style={[styles.thumb, { borderColor: statusColor, left: thumbLeft - 9 }]} /> : null}
      </View>
    </View>
  );
}

export default function CourseRow({ course, isLow, onPress }) {
  const fill = Math.max(0, Math.min(100, course.attendance));
  const hasClasses = course.classesHeld > 0;
  const classesToRecover = hasClasses ? Math.max(0, 3 * course.classesHeld - 4 * course.classesAttended) : 0;

  if (!isLow && hasClasses) {
    return (
      <View style={styles.compact}>
        <Check color={colors.inkMuted} size={16} strokeWidth={2.5} />
        <Text numberOfLines={1} style={styles.compactName}>{course.name}</Text>
        <Text style={styles.compactPercent}>{course.attendance}%</Text>
        <Pressable accessibilityLabel={`Simulate ${course.name}`} accessibilityRole="button" hitSlop={8} onPress={onPress} style={({ pressed }) => [styles.simulateButton, pressed && styles.pressed]}>
          <Text style={styles.simulateText}>Simulate</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.name}>{course.name}</Text>
          <Text style={styles.meta}>{formatCourseCode(course.code)}</Text>
        </View>
        <Text style={[styles.percent, hasClasses && styles.percentRisk]}>{course.attendance}%</Text>
      </View>

      <Text style={styles.recoveryText}>
        {hasClasses
          ? `Attend next ${classesToRecover} class${classesToRecover === 1 ? "" : "es"} to reach 75%`
          : "No classes yet"}
      </Text>

      <AttendanceProgressBar value={fill} />

      <Pressable accessibilityLabel={`Simulate ${course.name}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.simulateButton, styles.expandedSimulate, pressed && styles.pressed]}>
        <Text style={styles.simulateText}>Simulate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.card, borderWidth: 1, marginHorizontal: 16, marginVertical: 8, padding: 12 },
  compact: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: 1, flexDirection: "row", gap: 8, marginHorizontal: 16, marginVertical: 4, minHeight: 56, paddingHorizontal: 12 },
  compactName: { color: colors.ink, flex: 1, fontFamily: fonts.bodySemi, fontSize: 14 },
  compactPercent: { color: colors.inkMuted, fontFamily: fonts.bodySemi, fontSize: 14 },
  top: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  titleBlock: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 16 },
  meta: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  percent: { color: colors.inkMuted, fontFamily: fonts.headingExtra, fontSize: 20 },
  percentRisk: { color: colors.bad },
  recoveryText: { color: colors.bad, fontFamily: fonts.bodySemi, fontSize: 14, marginTop: 16 },
  progressWrap: { marginTop: 32, position: "relative" },
  track: { backgroundColor: "#E5E7EB", borderRadius: radii.pill, height: 10, overflow: "visible", position: "relative" },
  fill: { borderRadius: radii.pill, height: 10 },
  thumb: { backgroundColor: "#FFFFFF", borderRadius: radii.pill, borderWidth: 3, height: 18, position: "absolute", top: -4, width: 18, zIndex: 3 },
  thresholdNotch: { backgroundColor: "#9CA3AF", height: 16, position: "absolute", top: -3, width: 2, zIndex: 2 },
  thresholdBubble: { alignItems: "center", backgroundColor: "#F3F4F6", borderColor: "#E5E7EB", borderRadius: 6, borderWidth: 1, bottom: 18, justifyContent: "center", minHeight: 24, position: "absolute", width: 44, zIndex: 4 },
  thresholdText: { color: "#4B5563", fontFamily: fonts.bodyMedium, fontSize: 12 },
  caretBorder: { borderLeftColor: "transparent", borderLeftWidth: 5, borderRightColor: "transparent", borderRightWidth: 5, borderTopColor: "#E5E7EB", borderTopWidth: 5, bottom: -5, height: 0, position: "absolute", width: 0 },
  caretFill: { borderLeftColor: "transparent", borderLeftWidth: 4, borderRightColor: "transparent", borderRightWidth: 4, borderTopColor: "#F3F4F6", borderTopWidth: 4, bottom: -3, height: 0, position: "absolute", width: 0 },
  simulateButton: { alignItems: "center", justifyContent: "center", minHeight: 36, paddingHorizontal: 8 },
  expandedSimulate: { alignSelf: "flex-end", marginTop: 8 },
  simulateText: { color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 14 },
  pressed: { opacity: 0.7 },
});
