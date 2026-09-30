import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppBar from "../components/AppBar";
import Card from "../components/Card";
import Icon from "../components/Icon";
import ProgressRing from "../components/ProgressRing";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";
import { addSimulatedRecord, clearSimulatedRecords, formatCourseCode } from "../utils/attendance";

const UPCOMING_DOTS = 4;

function AttendanceDot({ presence, animated = false }) {
  const progress = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) Animated.timing(progress, { duration: 150, toValue: 1, useNativeDriver: true }).start();
  }, [animated, progress]);

  const filledStyle = presence === "P" ? styles.dotAttended : presence === "A" ? styles.dotMissed : styles.dotUpcoming;
  return <Animated.View style={[styles.attendanceDot, filledStyle, { opacity: progress, transform: [{ scale: progress }] }]} />;
}

function AttendanceDots({ records }) {
  return (
    <View accessibilityLabel="Attendance history" style={styles.dotRow}>
      {records.map((record) => <AttendanceDot animated={Boolean(record.isSimulated)} key={record.id} presence={record.presence} />)}
      {Array.from({ length: UPCOMING_DOTS }, (_, index) => <AttendanceDot key={`upcoming-${index}`} />)}
    </View>
  );
}

export default function SimulatorView({
  courses,
  focusCourseId = null,
  isLoading = false,
  recoveryPlans = {},
  setActiveTab,
  storageError = null,
  updateCourse,
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(focusCourseId);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;

  useEffect(() => {
    if (focusCourseId) setSelectedCourseId(focusCourseId);
  }, [focusCourseId]);

  if (isLoading) {
    return <View style={styles.centerState}><Text style={styles.centerTitle}>Loading simulator...</Text></View>;
  }

  const safeMisses = selectedCourse ? recoveryPlans[selectedCourse.id]?.safeMisses ?? 0 : 0;
  const isBelowThreshold = selectedCourse?.attendance < ATTENDANCE_THRESHOLD;

  return (
    <View style={styles.screen}>
      <AppBar onBack={() => setActiveTab("dashboard")} title="Simulator" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {storageError ? <View style={styles.warning}><Text style={styles.warningText}>{storageError}</Text></View> : null}

        <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}>
          {courses.map((course) => {
            const selected = course.id === selectedCourse?.id;
            return (
              <Pressable
                accessibilityLabel={`Select ${course.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={course.id}
                onPress={() => setSelectedCourseId(course.id)}
                style={[styles.courseChip, selected && styles.courseChipSelected]}
              >
                <Text style={[styles.chipCode, selected && styles.chipCodeSelected]}>{formatCourseCode(course.code)}</Text>
                <Text style={[styles.chipPercent, course.attendance < ATTENDANCE_THRESHOLD && styles.chipPercentRisk]}>{course.attendance}%</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedCourse ? (
          <Card style={styles.simulatorCard}>
            <View style={styles.courseHeader}>
              <View style={styles.courseTitleBlock}>
                <Text numberOfLines={1} style={styles.courseName}>{selectedCourse.name}</Text>
                <Text style={styles.courseMeta}>{formatCourseCode(selectedCourse.code)}</Text>
              </View>
              <Pressable
                accessibilityLabel={`Reset simulation for ${selectedCourse.name}`}
                onPress={() => updateCourse(selectedCourse.id, clearSimulatedRecords(selectedCourse))}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.attendanceSummary}>
              <ProgressRing
                color={isBelowThreshold ? colors.bad : colors.inkMuted}
                size={112}
                strokeWidth={10}
                threshold={ATTENDANCE_THRESHOLD}
                trackColor={colors.cardAlt}
                value={selectedCourse.attendance}
              >
                <Text style={styles.ringValue}>{selectedCourse.attendance}%</Text>
              </ProgressRing>
              <View style={styles.dotBlock}>
                <AttendanceDots records={selectedCourse.attendanceRecords} />
                <View style={styles.dotLegend}>
                  <Text style={styles.legendText}>Attended</Text>
                  <Text style={styles.legendText}>Missed</Text>
                  <Text style={styles.legendText}>Upcoming</Text>
                </View>
              </View>
            </View>

            <View style={styles.safeLine}>
              <Text style={styles.safeLabel}>Safe to miss:</Text>
              <Text style={styles.safeValue}>{safeMisses}</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel="Attend one simulated class"
                onPress={() => updateCourse(selectedCourse.id, addSimulatedRecord(selectedCourse, "P"))}
                style={({ pressed }) => [styles.actionButton, styles.attendButton, pressed && styles.pressed]}
              >
                <Icon color={colors.accent} name="attendance" size={18} />
                <Text style={[styles.actionText, styles.attendText]}>Attend</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Miss one simulated class"
                onPress={() => updateCourse(selectedCourse.id, addSimulatedRecord(selectedCourse, "A"))}
                style={({ pressed }) => [styles.actionButton, styles.missButton, pressed && styles.pressed]}
              >
                <Icon color={colors.bad} name="miss" size={18} />
                <Text style={[styles.actionText, styles.missText]}>Miss</Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card><Text style={styles.emptyText}>No course data is available.</Text></Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { paddingBottom: 32 },
  centerState: { alignItems: "center", flex: 1, justifyContent: "center" },
  centerTitle: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 14 },
  warning: { backgroundColor: colors.badSoft, borderColor: colors.bad, borderRadius: radii.control, borderWidth: 1, marginHorizontal: 16, marginTop: 16, padding: 12 },
  warningText: { color: colors.bad, fontFamily: fonts.bodyMedium, fontSize: 12 },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 16 },
  courseChip: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: 1, flexDirection: "row", gap: 8, minHeight: 44, paddingHorizontal: 12 },
  courseChipSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipCode: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 12 },
  chipCodeSelected: { color: colors.accent },
  chipPercent: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  chipPercentRisk: { color: colors.bad },
  simulatorCard: { marginTop: 0 },
  courseHeader: { alignItems: "center", flexDirection: "row", marginBottom: 16 },
  courseTitleBlock: { flex: 1, minWidth: 0 },
  courseName: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 16 },
  courseMeta: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  resetButton: { alignItems: "center", justifyContent: "center", minHeight: 36, paddingHorizontal: 8 },
  resetText: { color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 14 },
  attendanceSummary: { alignItems: "center", flexDirection: "row", gap: 16 },
  ringValue: { color: colors.ink, fontFamily: fonts.headingExtra, fontSize: 28 },
  dotBlock: { flex: 1 },
  dotRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attendanceDot: { borderRadius: radii.pill, borderWidth: 2, height: 14, width: 14 },
  dotAttended: { backgroundColor: colors.inkMuted, borderColor: colors.inkMuted },
  dotMissed: { backgroundColor: colors.bad, borderColor: colors.bad },
  dotUpcoming: { backgroundColor: "transparent", borderColor: colors.line },
  dotLegend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  legendText: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  safeLine: { alignItems: "center", backgroundColor: colors.cardAlt, borderRadius: radii.control, flexDirection: "row", justifyContent: "space-between", marginTop: 24, minHeight: 44, paddingHorizontal: 12 },
  safeLabel: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 14 },
  safeValue: { color: colors.ink, fontFamily: fonts.headingExtra, fontSize: 20 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionButton: { alignItems: "center", backgroundColor: colors.card, borderRadius: radii.control, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, height: 44, justifyContent: "center" },
  attendButton: { borderColor: colors.accent },
  missButton: { borderColor: colors.bad },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  attendText: { color: colors.accent },
  missText: { color: colors.bad },
  pressed: { opacity: 0.7 },
  emptyText: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
