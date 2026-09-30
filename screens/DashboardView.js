import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Line, Svg, Text as SvgText } from "react-native-svg";
import AppBar from "../components/AppBar";
import AddCourseModal from "../components/AddCourseModal";
import Card from "../components/Card";
import CourseRow from "../components/CourseRow";
import CustomButton from "../components/CustomButton";
import Icon from "../components/Icon";
import ProgressRing from "../components/ProgressRing";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";
import {
  buildAttendanceTrend,
  calculateAverageAttendance,
} from "../utils/chartData";
import { formatCourseCode } from "../utils/attendance";

const CHART_HEIGHT = 220;
const BAR_PLOT_HEIGHT = 180;
const BAR_LABEL_HEIGHT = 28;
const BAR_CHART_HEIGHT = BAR_PLOT_HEIGHT / 0.75;
const BAR_CARD_GUTTER = 64;
const baseChartConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  barPercentage: 0.55,
  color: () => "#6B7280",
  decimalPlaces: 0,
  labelColor: () => "#6B7280",
  propsForBackgroundLines: { stroke: "#E5E7EB" },
  propsForLabels: { fill: "#6B7280", fontFamily: fonts.bodyMedium, fontSize: 12 },
  propsForTopLabels: { fill: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12 },
};

// Trend line uses the single interactive accent with hollow markers.
const lineChartConfig = {
  ...baseChartConfig,
  propsForDots: { fill: "#FFFFFF", r: "3", stroke: "#10B981", strokeWidth: "2" },
  strokeWidth: 2,
};

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
  onAddCourse,
  onOpenSimulator,
  projectedGpa,
  recoveryPlans = {},
  restoreAnnouncements,
  storageError = null,
  view = "today",
  onBack,
  onOpenAlerts,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [lineIndex, setLineIndex] = useState(null);
  const [selectedBarCourseId, setSelectedBarCourseId] = useState(null);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [courseToast, setCourseToast] = useState(null);
  const toastTimer = useRef(null);
  const barFade = useRef(new Animated.Value(0)).current;
  const chartWidth = Math.max(Math.min(windowWidth, 480) - 56, 0);
  const barDataSignature = courses.map((course) => course.id + ":" + course.attendance).join("|");

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    barFade.setValue(0);
    Animated.timing(barFade, {
      duration: 250,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [barDataSignature, barFade]);

  const handleAddCourse = (course) => {
    onAddCourse(course);
    setCourseToast(`${course.code} added`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setCourseToast(null), 2000);
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Loading your semester...</Text>
      </View>
    );
  }

  const averageAttendance = calculateAverageAttendance(courses);
  const rankedCourses = [...courses].sort((a, b) => a.attendance - b.attendance);
  const atRisk = rankedCourses.filter((course) => course.classesHeld > 0 && course.attendance < ATTENDANCE_THRESHOLD);
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
        <View style={styles.sectionHeadingCopy}>
          <Text style={styles.sectionTitle}>Your courses</Text>
          <Text style={styles.sectionMeta}>lowest attendance first</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setAddCourseOpen(true)} style={styles.addCourseButton}>
          <Text style={styles.addCourseText}>+ Add course</Text>
        </Pressable>
      </View>
      {courses.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No courses yet. Add your first course.</Text>
        </Card>
      ) : (
        rankedCourses.map((course) => {
          const isLow = course.classesHeld > 0 && course.attendance < ATTENDANCE_THRESHOLD;
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

  // ----- attendance insights -----
  const trend = buildAttendanceTrend(courses);
  const trendValues = trend.datasets[0].data;
  const barCourses = [...courses].sort((a, b) => a.attendance - b.attendance);
  const barData = {
    labels: barCourses.map((course) => course.code ?? course.shortName),
    datasets: [{
      data: barCourses.map((course) => course.attendance),
      colors: barCourses.map((course) => () =>
        course.attendance >= ATTENDANCE_THRESHOLD ? "#10B981" : "#D64560"
      ),
    }],
  };
  const barAvailableWidth = Math.max(chartWidth - BAR_CARD_GUTTER, 0);
  const barSlotWidth = courses.length > 6 ? 56 : Math.min(barAvailableWidth / barCourses.length, 96);
  const barChartWidth = barSlotWidth * barCourses.length;
  const barWidth = barSlotWidth * 0.72;
  const barPercentage = barWidth / 32;
  const barChartLeft = -(barWidth - barSlotWidth / 2);
  const selectedBarCourse = barCourses.find((course) => course.id === selectedBarCourseId) ?? null;
  const layeredBarChartConfig = {
    ...baseChartConfig,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    barPercentage,
    barRadius: barWidth / 2,
  };
  const lineSel = lineIndex !== null && lineIndex < trendValues.length ? lineIndex : null;
  const requirementY = 16 + (CHART_HEIGHT * 0.75) * 0.25;
  const lineData = {
    labels: trend.labels,
    datasets: [
      { ...trend.datasets[0], color: () => "#10B981", strokeWidth: 2 },
      { data: [0, 100], color: () => "rgba(255,255,255,0)", strokeWidth: 0, withDots: false },
    ],
  };

  const chartsBlock =
    courses.length > 0 ? (
      <View style={styles.insightsSection}>
        <Text style={styles.insightsHeading}>Insights</Text>
        <View style={styles.insightsStack}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Attendance trend</Text>
            <Text style={styles.chartHint}>Average across all courses by lecture</Text>
            <View style={styles.chartWrap}>
              <LineChart
                chartConfig={lineChartConfig}
                data={lineData}
                decorator={() => (
                  <Line stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth="1"
                    x1="64" x2={chartWidth - 16} y1={requirementY} y2={requirementY} />
                )}
                fromZero
                fromNumber={100}
                height={CHART_HEIGHT}
                onDataPointClick={({ index }) => {
                  if (index < trendValues.length) setLineIndex(index);
                }}
                segments={4}
                withOuterLines={false}
                withShadow={false}
                withVerticalLines={false}
                width={chartWidth}
                yAxisSuffix="%"
              />
            </View>
            {lineSel !== null ? (
              <Text style={styles.chartSelection}>Lecture {lineSel + 1}: {trendValues[lineSel]}%</Text>
            ) : null}
          </View>
          <View style={[styles.chartCard, styles.barChartCard]}>
            <Text style={styles.chartTitle}>By course</Text>
            <Text style={styles.chartHint}>Current attendance per course</Text>
            <Pressable onPress={() => setSelectedBarCourseId(null)} style={styles.barViewport}>
              <ScrollView
                contentContainerStyle={[
                  courses.length <= 6 && styles.barScrollCentered,
                ]}
                horizontal
                scrollEnabled={courses.length > 6}
                showsHorizontalScrollIndicator={false}
              >
                <Animated.View style={[styles.layeredBarChart, { opacity: barFade, width: barChartWidth }]}>
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {barCourses.map((course, index) => (
                      <View
                        key={"track-" + course.id}
                        style={[
                          styles.barTrack,
                          {
                            left: index * barSlotWidth + (barSlotWidth - barWidth) / 2,
                            width: barWidth,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Svg height={BAR_PLOT_HEIGHT} pointerEvents="none" style={styles.barReference} width={barChartWidth}>
                    <Line
                      stroke="#9CA3AF"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      x1="0"
                      x2={barChartWidth}
                      y1={BAR_PLOT_HEIGHT * 0.25}
                      y2={BAR_PLOT_HEIGHT * 0.25}
                    />
                    <SvgText
                      fill="#6B7280"
                      fontFamily={fonts.bodyMedium}
                      fontSize="12"
                      textAnchor="start"
                      x="4"
                      y={BAR_PLOT_HEIGHT * 0.25 - 5}
                    >
                      75%
                    </SvgText>
                  </Svg>
                  <BarChart
                    chartConfig={layeredBarChartConfig}
                    data={barData}
                    flatColor
                    fromNumber={100}
                    fromZero
                    height={BAR_CHART_HEIGHT}
                    segments={4}
                    showBarTops={false}
                    showValuesOnTopOfBars={false}
                    style={StyleSheet.flatten([styles.chartKitBarLayer, { left: barChartLeft }])}
                    width={barChartWidth}
                    withCustomBarColorFromData
                    withHorizontalLabels={false}
                    withInnerLines={false}
                    withVerticalLabels={false}
                    yAxisLabel=""
                    yAxisSuffix="%"
                  />
                  {barCourses.map((course, index) => {
                    const value = Math.max(0, Math.min(100, course.attendance));
                    const fillHeight = (value / 100) * BAR_PLOT_HEIGHT;
                    const insideFill = fillHeight >= 40;
                    return (
                      <Text
                        key={"value-" + course.id}
                        pointerEvents="none"
                        style={[
                          styles.barValue,
                          {
                            color: insideFill ? "#FFFFFF" : "#1F2937",
                            left: index * barSlotWidth,
                            top: insideFill
                              ? BAR_PLOT_HEIGHT - fillHeight + 18
                              : Math.max(0, BAR_PLOT_HEIGHT - fillHeight - 18),
                            width: barSlotWidth,
                          },
                        ]}
                      >
                        {value}%
                      </Text>
                    );
                  })}
                  {barCourses.map((course, index) => (
                    <Text
                      key={"label-" + course.id}
                      numberOfLines={1}
                      pointerEvents="none"
                      style={[styles.barCourseLabel, { left: index * barSlotWidth, width: barSlotWidth }]}
                    >
                      {formatCourseCode(course.code)}
                    </Text>
                  ))}
                  {barCourses.map((course, index) => {
                    const below = course.attendance < ATTENDANCE_THRESHOLD;
                    return (
                      <Pressable
                        accessibilityLabel={
                          course.name + ", " + course.attendance +
                          " percent attendance, " +
                          (below ? "below" : "at or above") +
                          " the 75 percent requirement"
                        }
                        accessibilityRole="button"
                        key={"touch-" + course.id}
                        onPress={(event) => {
                          event.stopPropagation();
                          setSelectedBarCourseId((current) => current === course.id ? null : course.id);
                        }}
                        style={[styles.barTouchTarget, { left: index * barSlotWidth, width: barSlotWidth }]}
                      />
                    );
                  })}
                </Animated.View>
              </ScrollView>
            </Pressable>
            <View style={styles.barLegend}>
              <View style={styles.barLegendItem}>
                <View style={[styles.barLegendDot, styles.barLegendOnTrack]} />
                <Text style={styles.barLegendText}>On track</Text>
              </View>
              <View style={styles.barLegendItem}>
                <View style={[styles.barLegendDot, styles.barLegendRisk]} />
                <Text style={styles.barLegendText}>Below 75%</Text>
              </View>
            </View>
            {selectedBarCourse ? (
              <Text style={styles.chartSelection}>
                {selectedBarCourse.name} · {selectedBarCourse.classesAttended} of {selectedBarCourse.classesHeld} classes · {selectedBarCourse.attendance}%
              </Text>
            ) : null}
          </View>
        </View>
      </View>
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

        {view === "today" ? heroBlock : null}
        {coursesBlock}
        {view === "attendance" ? chartsBlock : null}
        {view === "today" ? announcementsBlock : null}
      </ScrollView>

      <AddCourseModal courses={courses} onClose={() => setAddCourseOpen(false)} onSubmit={handleAddCourse} visible={addCourseOpen} />
      {courseToast ? <View style={styles.toast}><Text style={styles.toastText}>{courseToast}</Text></View> : null}

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
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8, paddingTop: 24 },
  sectionHeadingCopy: { flex: 1 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 20 },
  sectionMeta: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  addCourseButton: { alignItems: "center", height: 44, justifyContent: "center", paddingHorizontal: 8 },
  addCourseText: { color: "#059669", fontFamily: fonts.bodySemi, fontSize: 14 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 16, marginBottom: 4 },
  emptyText: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  restore: { marginTop: 16 },
  insightsSection: { marginTop: 24, paddingHorizontal: 16 },
  insightsHeading: { color: "#1F2937", fontFamily: fonts.heading, fontSize: 16, marginBottom: 12 },
  insightsStack: { gap: 12 },
  chartCard: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: 6, borderWidth: 1, overflow: "hidden", padding: 12 },
  barChartCard: { marginRight: BAR_CARD_GUTTER },
  chartTitle: { color: "#1F2937", fontFamily: fonts.bodySemi, fontSize: 14 },
  chartHint: { color: "#6B7280", fontFamily: fonts.bodyMedium, fontSize: 12, marginBottom: 8, marginTop: 4 },
  chartWrap: { alignSelf: "center" },
  chartSelection: { color: "#6B7280", fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  barViewport: { width: "100%" },
  barScrollCentered: { flexGrow: 1 },
  layeredBarChart: { height: BAR_PLOT_HEIGHT + BAR_LABEL_HEIGHT, overflow: "hidden", position: "relative" },
  barTrack: { backgroundColor: "#F3F4F6", borderTopLeftRadius: 999, borderTopRightRadius: 999, height: BAR_PLOT_HEIGHT, position: "absolute", top: 0 },
  barReference: { left: 0, position: "absolute", top: 0, zIndex: 1 },
  chartKitBarLayer: { paddingRight: 0, paddingTop: 0, position: "absolute", top: 0, zIndex: 2 },
  barValue: { fontFamily: fonts.bodySemi, fontSize: 12, position: "absolute", textAlign: "center", zIndex: 3 },
  barCourseLabel: { color: "#6B7280", fontFamily: fonts.bodyMedium, fontSize: 12, height: BAR_LABEL_HEIGHT, paddingTop: 8, position: "absolute", textAlign: "center", top: BAR_PLOT_HEIGHT, zIndex: 3 },
  barTouchTarget: { height: BAR_PLOT_HEIGHT + BAR_LABEL_HEIGHT, position: "absolute", top: 0, zIndex: 4 },
  barLegend: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  barLegendItem: { alignItems: "center", flexDirection: "row", gap: 4 },
  barLegendDot: { borderRadius: radii.pill, height: 8, width: 8 },
  barLegendOnTrack: { backgroundColor: "#10B981" },
  barLegendRisk: { backgroundColor: "#D64560" },
  barLegendText: { color: "#6B7280", fontFamily: fonts.bodyMedium, fontSize: 12 },
  noteCard: { alignItems: "flex-start", flexDirection: "row", gap: 8, paddingVertical: 12 },
  noteIcon: { alignItems: "center", backgroundColor: colors.cardAlt, borderRadius: radii.pill, height: 40, justifyContent: "center", width: 40 },
  noteBody: { flex: 1 },
  noteLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12, marginBottom: 4 },
  noteText: { color: colors.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  dismiss: { alignItems: "center", height: 44, justifyContent: "center", marginRight: -10, marginTop: -8, width: 44 },
  toast: { alignItems: "center", backgroundColor: "#1F2937", borderRadius: radii.control, bottom: 16, left: 16, minHeight: 44, paddingHorizontal: 16, position: "absolute", right: 16, justifyContent: "center" },
  toastText: { color: "#FFFFFF", fontFamily: fonts.bodySemi, fontSize: 14 },
});
