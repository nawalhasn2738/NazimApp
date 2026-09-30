import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";
import { formatCourseCode } from "../utils/attendance";

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

      <View style={styles.progressWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fill}%` }]} />
          <View style={[styles.tick, { left: `${ATTENDANCE_THRESHOLD}%` }]} />
        </View>
        <Text style={styles.tickLabel}>75%</Text>
      </View>

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
  progressWrap: { paddingRight: 32, position: "relative" },
  track: { backgroundColor: colors.cardAlt, borderRadius: radii.pill, height: 8, marginTop: 16, overflow: "hidden" },
  fill: { backgroundColor: colors.bad, borderRadius: radii.pill, height: "100%" },
  tick: { backgroundColor: colors.ink, height: "100%", position: "absolute", width: 2 },
  tickLabel: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, position: "absolute", right: 0, top: 12 },
  simulateButton: { alignItems: "center", justifyContent: "center", minHeight: 36, paddingHorizontal: 8 },
  expandedSimulate: { alignSelf: "flex-end", marginTop: 8 },
  simulateText: { color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 14 },
  pressed: { opacity: 0.7 },
});
