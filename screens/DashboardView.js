import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import AppBar from "../components/AppBar";
import Card from "../components/Card";
import CourseRow from "../components/CourseRow";
import CustomButton from "../components/CustomButton";
import InteractiveChart from "../components/InteractiveChart";
import Icon from "../components/Icon";
import ProgressRing from "../components/ProgressRing";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";
import useLayout from "../hooks/useLayout";
import {
  BAR_BASE_WIDTH,
  BAR_PERCENTAGE,
  buildAttendanceByCourseData,
  buildAttendanceTrend,
  calculateAverageAttendance,
  describeLecture,
  getBarIndexFromX,
  getBarPoint,
  getLineIndexFromX,
  getLinePoint,
} from "../utils/chartData";

const CHART_HEIGHT = 220;
const baseChartConfig = {
  backgroundGradientFrom: colors.card,
  backgroundGradientTo: colors.card,
  barPercentage: BAR_PERCENTAGE,
  color: () => colors.inkMuted,
  decimalPlaces: 0,
  labelColor: () => colors.inkMuted,
  propsForBackgroundLines: { stroke: colors.line, strokeDasharray: "4 6" },
  propsForLabels: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  propsForTopLabels: { fill: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12 },
};

// Trend line uses the single interactive accent with hollow markers.
const lineChartConfig = {
  ...baseChartConfig,
  propsForDots: { fill: colors.card, r: "6", stroke: colors.accent, strokeWidth: "3" },
  strokeWidth: 3.5,
};

// Bar: solid capsule bars (per-bar red / green colors come from the data).
const barChartConfig = { ...baseChartConfig, barRadius: (BAR_BASE_WIDTH * BAR_PERCENTAGE) / 2 };


/**
 * Home screen: app bar (alerts bell + overflow menu), an at-a-glance gauge,
 * a tappable course list, two charts, dismissible announcements, and a
 * floating action button into the simulator.
 *
 * @param {{ announcements: Array<{ id: string, label: string, text: string }>, baselineGpa: string, courses: Array<object>, dismissAnnouncement: (id: string) => void, gpaDelta: string, isLoading?: boolean, onOpenSimulator: (courseId?: string) => void, projectedGpa: string, recoveryPlans?: Record<string, { classesToRecover: number }>, restoreAnnouncements: () => void, storageError?: string | null }} props
 */
export default function DashboardView({
  announcements,
  baselineGpa,
  courses,
  dismissAnnouncement,
  gpaDelta,
  isLoading = false,
  onOpenSimulator,
  projectedGpa,
  recoveryPlans = {},
  restoreAnnouncements,
  storageError = null,
  view = "today",
  onBack,
  onOpenAlerts,
}) {
  const { contentWidth, isWide } = useLayout();
  const [lineIndex, setLineIndex] = useState(null);
  const [barIndex, setBarIndex] = useState(null);
  // Charts fit their column: half the shell on wide windows, the full width on phones.
  const chartWidth = Math.max(Math.min((isWide ? contentWidth / 2 : contentWidth) - 72, 560), 260);

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Loading your semester...</Text>
      </View>
    );
  }

  const averageAttendance = calculateAverageAttendance(courses);
  const rankedCourses = [...courses].sort((a, b) => a.attendance - b.attendance);
  const atRisk = rankedCourses.filter((course) => course.attendance < ATTENDANCE_THRESHOLD);
  const delta = Number(gpaDelta);
  const ringColor = averageAttendance < ATTENDANCE_THRESHOLD ? colors.bad : colors.good;

  const gaugeCards = [
    {
      key: "attendance",
      label: "Attendance",
      color: ringColor,
      percent: averageAttendance,
      center: `${averageAttendance}%`,
      threshold: ATTENDANCE_THRESHOLD,
    },
    { key: "gpa", label: "Current GPA", color: colors.inkMuted, percent: (Number(baselineGpa) / 4) * 100, center: baselineGpa },
  ];
  const summaryStats = [
    { key: "whatif", label: "What-if GPA", value: projectedGpa, sub: `${delta > 0 ? "+" : ""}${gpaDelta}`, tone: delta < 0 ? colors.bad : delta > 0 ? colors.good : colors.inkMuted },
    { key: "risk", label: "Courses at risk", value: String(atRisk.length), tone: atRisk.length > 0 ? colors.bad : colors.good },
    { key: "count", label: "Courses", value: String(courses.length) },
  ];

  const heroBlock = (
    <View>
      <View style={styles.ringRow}>
        {gaugeCards.map((gauge) => (
          <Card key={gauge.key} style={styles.ringCard}>
            <ProgressRing
              color={gauge.color}
              size={104}
              strokeWidth={10}
              threshold={gauge.threshold}
              value={gauge.percent}
            >
              <Text style={styles.ringValue}>{gauge.center}</Text>
            </ProgressRing>
            <Text style={styles.ringLabel}>{gauge.label}</Text>
          </Card>
        ))}
      </View>
      <Card>
        <View style={styles.statRow}>
          {summaryStats.map((stat) => (
            <View key={stat.key} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={[styles.statBar, { backgroundColor: stat.tone ?? colors.inkMuted }]} />
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.sub ? <Text style={[styles.statSub, { color: stat.tone }]}>{stat.sub}</Text> : null}
            </View>
          ))}
        </View>
        <Text style={styles.note}>
          Mock GPA estimate, not official. The tick on the attendance ring marks {ATTENDANCE_THRESHOLD}%.
        </Text>
      </Card>
    </View>
  );

  const coursesBlock = (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your courses</Text>
        <Text style={styles.sectionMeta}>lowest attendance first</Text>
      </View>
      {courses.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No courses yet</Text>
          <Text style={styles.emptyText}>Open the simulator to add a course or restore the sample data.</Text>
        </Card>
      ) : (
        rankedCourses.map((course) => {
          const isLow = course.attendance < ATTENDANCE_THRESHOLD;
          const needed = recoveryPlans[course.id]?.classesToRecover ?? 0;
          return (
            <CourseRow
              course={course}
              hint={isLow ? `attend next ${needed}` : "on track"}
              isLow={isLow}
              key={course.id}
              onPress={() => onOpenSimulator(course.id)}
            />
          );
        })
      )}
    </>
  );

  // ----- touch-interactive charts -----
  const trend = buildAttendanceTrend(courses);
  const trendValues = trend.datasets[0].data;
  const barData = buildAttendanceByCourseData(courses);
  const barValues = barData.datasets[0].data;
  const barCourses = [...courses].sort((a, b) => a.attendance - b.attendance); // same order as the chart
  // Ignore a stale selection if the data shrank (e.g. a course was removed).
  const lineSel = lineIndex !== null && lineIndex < trendValues.length ? lineIndex : null;
  const barSel = barIndex !== null && barIndex < barValues.length ? barIndex : null;

  let lineSelected = null;
  if (lineSel !== null) {
    const point = getLinePoint(trendValues, lineSel, chartWidth, CHART_HEIGHT);
    const info = describeLecture(courses, lineSel);
    lineSelected = { ...point, bubble: `Lecture ${info.lecture} - ${info.average}%` };
  }

  let barSelected = null;
  if (barSel !== null) {
    const point = getBarPoint(barValues, barSel, chartWidth, CHART_HEIGHT);
    const course = barCourses[barSel];
    barSelected = { ...point, bubble: `${course.shortName} - ${course.attendance}%` };
  }

  const chartsBlock =
    courses.length > 0 ? (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance insights</Text>
        </View>
        <Card>
          <Text style={styles.chartTitle}>Trend by lecture</Text>
          <Text style={styles.chartHint}>Average attendance across all courses</Text>
          <View style={styles.chartWrap}>
            <InteractiveChart
              height={CHART_HEIGHT}
              indexFromX={(x) => getLineIndexFromX(trendValues.length, x, chartWidth)}
              kind="line"
              label="Trend chart. Press or drag to inspect a lecture"
              onSelect={setLineIndex}
              selected={lineSelected}
              selectedIndex={lineSel}
              referenceValue={ATTENDANCE_THRESHOLD}
              width={chartWidth}
            >
              <LineChart
                bezier
                chartConfig={lineChartConfig}
                data={{ ...trend, datasets: [{ ...trend.datasets[0], color: () => colors.accent }] }}
                fromZero
                fromNumber={100}
                height={CHART_HEIGHT}
                segments={4}
                withOuterLines={false}
                withVerticalLines={false}
                width={chartWidth}
                yAxisSuffix="%"
              />
            </InteractiveChart>
          </View>
        </Card>
        <Card>
          <Text style={styles.chartTitle}>By course</Text>
          <Text style={styles.chartHint}>Red bars are below {ATTENDANCE_THRESHOLD}%</Text>
          <View style={styles.chartWrap}>
            <InteractiveChart
              height={CHART_HEIGHT}
              indexFromX={(x) => getBarIndexFromX(barValues.length, x, chartWidth)}
              kind="bar"
              label="Course chart. Press a bar to inspect a course"
              onSelect={setBarIndex}
              selected={barSelected}
              selectedIndex={barSel}
              referenceValue={ATTENDANCE_THRESHOLD}
              width={chartWidth}
            >
              <BarChart
                chartConfig={barChartConfig}
                data={barData}
                flatColor
                fromZero
                fromNumber={100}
                height={CHART_HEIGHT}
                segments={4}
                showBarTops={false}
                showValuesOnTopOfBars
                width={chartWidth}
                withCustomBarColorFromData
                yAxisLabel=""
                yAxisSuffix="%"
              />
            </InteractiveChart>
          </View>
        </Card>
      </>
    ) : null;

  const announcementsBlock = (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        <Text style={styles.sectionMeta}>{announcements.length} new</Text>
      </View>
      {announcements.length > 0 ? (
        announcements.map((announcement) => (
          <Card key={announcement.id} style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <Icon color={colors.ink} name="announce" size={20} />
            </View>
            <View style={styles.noteBody}>
              <Text style={styles.noteLabel}>{announcement.label}</Text>
              <Text style={styles.noteText}>{announcement.text}</Text>
            </View>
            <Pressable
              accessibilityLabel={`Dismiss announcement: ${announcement.label}`}
              accessibilityRole="button"
              onPress={() => dismissAnnouncement(announcement.id)}
              style={styles.dismiss}
            >
              <Icon color={colors.inkMuted} name="close" size={18} />
            </Pressable>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyText}>There are no announcements right now.</Text>
          <CustomButton
            title="Show dismissed announcements"
            variant="secondary"
            onPress={restoreAnnouncements}
            style={styles.restore}
          />
        </Card>
      )}
    </>
  );

  return (
    <View style={styles.screen}>
      <AppBar
        actions={[{ icon: "alert", label: "Alerts", badge: atRisk.length, onPress: onOpenAlerts }]}
        onBack={onBack}
        subtitle={view === "attendance" ? undefined : "Semester overview"}
        title={view === "attendance" ? "Attendance" : "Nazim"}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {storageError ? (
          <Card style={styles.warnCard}>
            <Text style={styles.warnText}>{storageError}</Text>
          </Card>
        ) : null}

        {isWide ? (
          <View style={styles.columns}>
            <View style={styles.column}>
              {heroBlock}
              {coursesBlock}
              {announcementsBlock}
            </View>
            <View style={styles.column}>{chartsBlock}</View>
          </View>
        ) : (
          <>
            {view === "today" ? heroBlock : null}
            {coursesBlock}
            {view === "today" ? chartsBlock : null}
            {view === "today" ? announcementsBlock : null}
          </>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 32, paddingTop: 8 },
  centerState: { alignItems: "center", flex: 1, justifyContent: "center" },
  centerTitle: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 14 },
  warnCard: { backgroundColor: colors.warnSoft },
  warnText: { color: colors.warn, fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  columns: { alignItems: "flex-start", flexDirection: "row" },
  column: { flex: 1 },
  ringRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  ringCard: { alignItems: "center", flex: 1, marginHorizontal: 0, paddingHorizontal: 12 },
  ringValue: { color: colors.ink, fontFamily: fonts.headingExtra, fontSize: 20 },
  ringLabel: { color: colors.inkMuted, fontFamily: fonts.bodySemi, fontSize: 12, marginTop: 12 },
  statRow: { flexDirection: "row", gap: 12 },
  stat: { flex: 1 },
  statValue: { color: colors.ink, fontFamily: fonts.headingExtra, fontSize: 28 },
  statBar: { borderRadius: radii.pill, height: 3, marginVertical: 4, width: 34 },
  statLabel: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  statSub: { fontFamily: fonts.bodyBold, fontSize: 12, marginTop: 4 },
  note: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, marginTop: 16 },
  sectionHeader: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8, paddingTop: 24 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 20 },
  sectionMeta: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 16, marginBottom: 4 },
  emptyText: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  restore: { marginTop: 16 },
  chartTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 16 },
  chartHint: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, marginBottom: 8, marginTop: 4 },
  chartWrap: { alignSelf: "center", marginLeft: -8 },
  noteCard: { alignItems: "flex-start", flexDirection: "row", gap: 8, paddingVertical: 12 },
  noteIcon: { alignItems: "center", backgroundColor: colors.cardAlt, borderRadius: radii.pill, height: 40, justifyContent: "center", width: 40 },
  noteBody: { flex: 1 },
  noteLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12, marginBottom: 4 },
  noteText: { color: colors.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  dismiss: { alignItems: "center", height: 44, justifyContent: "center", marginRight: -10, marginTop: -8, width: 44 },
});
