import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Svg, { Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import Card from "../components/Card";
import CustomButton from "../components/CustomButton";
import OrganicIcon from "../components/OrganicIcon";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";

function calculateGpa(courses) {
  if (courses.length === 0) {
    return "0.00";
  }

  const totalCredits = courses.reduce((sum, course) => sum + course.creditHours, 0);
  const weightedPoints = courses.reduce(
    (sum, course) => sum + (course.expectedScore / 100) * 4 * course.creditHours,
    0,
  );

  return totalCredits === 0 ? "0.00" : (weightedPoints / totalCredits).toFixed(2);
}

function calculateAverageAttendance(courses) {
  if (courses.length === 0) {
    return 0;
  }

  const totalAttendance = courses.reduce((sum, course) => sum + course.attendance, 0);
  return Math.round(totalAttendance / courses.length);
}

function buildAttendanceTrend(courses) {
  const maxLectures = Math.max(...courses.map((course) => course.attendanceRecords?.length ?? 0), 0);

  if (maxLectures === 0) {
    return { labels: ["L1"], datasets: [{ data: [0] }] };
  }

  const data = Array.from({ length: maxLectures }, (_, lectureIndex) => {
    const courseAverages = courses.map((course) => {
      const visibleRecords = course.attendanceRecords.slice(0, lectureIndex + 1);
      if (visibleRecords.length === 0) {
        return 0;
      }

      const present = visibleRecords.filter((record) => record.presence === "P").length;
      return Math.round((present / visibleRecords.length) * 100);
    });

    return Math.round(
      courseAverages.reduce((sum, value) => sum + value, 0) / Math.max(courseAverages.length, 1),
    );
  });

  return {
    labels: data.map((_, index) => (index % 2 === 0 ? `L${index + 1}` : "")),
    datasets: [{ data }],
  };
}


function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(centerX, centerY, radius, startAngle, endAngle) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(" ");
}

const gradeDistributionSegments = [
  {
    label: "48%",
    startAngle: 180,
    endAngle: 266.4,
    stroke: "url(#gradeSageGradient)",
    callout: { labelX: 78, labelY: 30, lineX1: 92, lineY1: 38, lineX2: 92, lineY2: 86 },
  },
  {
    label: "36%",
    startAngle: 266.4,
    endAngle: 331.2,
    stroke: "#18392B",
    callout: { labelX: 202, labelY: 48, lineX1: 216, lineY1: 56, lineX2: 216, lineY2: 96 },
  },
  {
    label: "16%",
    startAngle: 331.2,
    endAngle: 360,
    stroke: "#C06F43",
    callout: { labelX: 282, labelY: 130, lineX1: 276, lineY1: 135, lineX2: 318, lineY2: 135 },
  },
];
const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  barPercentage: 0.6,
  color: (opacity = 1) => `rgba(24, 57, 43, ${opacity})`,
  decimalPlaces: 0,
  fillShadowGradient: colors.matteSage,
  fillShadowGradientOpacity: 0.9,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  propsForBackgroundLines: {
    stroke: colors.matteLine,
    strokeDasharray: "4 5",
  },
  propsForDots: {
    r: "4",
    stroke: colors.surface,
    strokeWidth: "2",
  },
  propsForLabels: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
};

/**
 * @param {{ announcements: Array<{ id: string, label: string, text: string }>, courses: Array<{ id: string, shortName: string, creditHours: number, expectedScore: number, attendance: number, attendanceRecords: Array<{ presence: "P" | "A" }> }>, setActiveTab: (tab: "dashboard" | "simulator") => void }} props
 */
export default function DashboardView({ announcements, courses, setActiveTab }) {
  const [alertsVisible, setAlertsVisible] = useState(false);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 48, 450), 300);

  const cumulativeGpa = calculateGpa(courses);
  const totalCredits = courses.reduce((sum, course) => sum + course.creditHours, 0);
  const averageAttendance = calculateAverageAttendance(courses);
  const lowAttendanceCourses = courses.filter((course) => course.attendance < ATTENDANCE_THRESHOLD);
  const healthLabel = lowAttendanceCourses.length > 0 ? `${lowAttendanceCourses.length} critical` : "On track";

  const attendanceTrendData = buildAttendanceTrend(courses);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <View style={styles.brandRow}>
            <View style={styles.headerTitleBlock}>
              <Text numberOfLines={1} style={styles.eyebrow}>Nizam-App</Text>
              <Text ellipsizeMode="tail" numberOfLines={1} style={styles.title}>Analytics Dashboard</Text>
            </View>
            <Pressable
              accessibilityLabel={`${lowAttendanceCourses.length} critical attendance alerts`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setAlertsVisible(true)}
              style={({ pressed }) => [styles.notificationButton, pressed && styles.notificationButtonPressed]}
            >
              <OrganicIcon color={colors.matteForest} name="alert" size={23} strokeWidth={1.9} />
              {lowAttendanceCourses.length > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{lowAttendanceCourses.length}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <Text numberOfLines={2} style={styles.subtitle}>A clean academic dashboard for GPA planning, attendance risk, and what-if decisions.</Text>
        </View>

        <View style={styles.metricStackList}>
          <Card style={[styles.metricRowCard, styles.metricRowForest]}>
            <View style={styles.metricRowLeft}>
              <View style={styles.metricIconPillActive}>
                <OrganicIcon color={colors.matteMint} name="chart" size={22} strokeWidth={1.8} />
              </View>
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricValueActive}>{cumulativeGpa}</Text>
                <Text style={styles.metricLabelActive}>Cumulative GPA</Text>
              </View>
            </View>
            <Text style={styles.metricHintActive}>Weighted from current expected scores.</Text>
          </Card>

          <Card style={[styles.metricRowCard, styles.metricRowSage]}>
            <View style={styles.metricRowLeft}>
              <View style={styles.metricIconPill}>
                <OrganicIcon color={colors.matteForest} name="credits" size={20} strokeWidth={1.8} />
              </View>
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricValue}>{totalCredits}</Text>
                <Text style={styles.metricLabel}>Enrolled Credits</Text>
              </View>
            </View>
            <Text style={styles.metricHint}>{courses.length} active subjects</Text>
          </Card>

          <Card style={[styles.metricRowCard, styles.metricRowPaper]}>
            <View style={styles.metricRowLeft}>
              <View style={styles.metricIconPill}>
                <OrganicIcon color={colors.matteForest} name="attendance" size={20} strokeWidth={1.8} />
              </View>
              <View style={styles.metricTextBlock}>
                <Text
                  style={[
                    styles.metricValue,
                    averageAttendance < ATTENDANCE_THRESHOLD && styles.criticalText,
                  ]}
                >
                  {averageAttendance}%
                </Text>
                <Text style={styles.metricLabel}>Attendance Health</Text>
              </View>
            </View>
            <View
              style={[
                styles.healthPill,
                lowAttendanceCourses.length > 0 && styles.healthPillCritical,
              ]}
            >
              <Text
                style={[
                  styles.healthPillText,
                  lowAttendanceCourses.length > 0 && styles.healthPillTextCritical,
                ]}
              >
                {healthLabel}
              </Text>
            </View>
          </Card>
        </View>

        <Card style={styles.tickerCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcement Ticker</Text>
            <Text style={styles.sectionMeta}>{announcements.length} live</Text>
          </View>
          <View style={styles.tickerList}>
            {announcements.map((announcement, index) => (
              <View key={announcement.id} style={styles.tickerItem}>
                <View style={styles.tickerIndexCircle}>
                  <Text style={styles.tickerIndex}>{index + 1}</Text>
                </View>
                <View style={styles.tickerTextBlock}>
                  <Text style={styles.announcementLabel}>{announcement.label}</Text>
                  <Text style={styles.announcementText}>{announcement.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {courses.length > 0 ? (
          <>
            <Card style={styles.chartCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Total Attendance Trend</Text>
                <Text style={styles.sectionMeta}>lecture-wise</Text>
              </View>
              <LineChart
                bezier
                chartConfig={chartConfig}
                data={attendanceTrendData}
                fromZero
                height={230}
                segments={4}
                style={styles.chart}
                width={chartWidth}
                yAxisSuffix="%"
              />
            </Card>

            <Card style={styles.gradeCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Course Grade Distribution</Text>
                  <Text style={styles.gradeSubtitle}>Grade band distribution</Text>
                </View>
                <Text style={styles.sectionMeta}>48 / 36 / 16</Text>
              </View>

              <View style={styles.gradeGaugeWrap}>
                <Svg height={190} viewBox="0 0 340 190" width="100%">
                  <Defs>
                    <LinearGradient id="gradeSageGradient" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor={colors.matteSage} />
                      <Stop offset="1" stopColor={colors.matteMint} />
                    </LinearGradient>
                  </Defs>
                  <Path
                    d={describeArc(170, 160, 104, 180, 360)}
                    fill="none"
                    stroke="rgba(24, 57, 43, 0.07)"
                    strokeLinecap="round"
                    strokeWidth={56}
                  />
                  {gradeDistributionSegments.map((segment) => (
                    <Path
                      key={segment.label}
                      d={describeArc(170, 160, 104, segment.startAngle, segment.endAngle)}
                      fill="none"
                      stroke={segment.stroke}
                      strokeLinecap="round"
                      strokeWidth={56}
                    />
                  ))}
                  {gradeDistributionSegments.map((segment) => (
                    <Line
                      key={`${segment.label}-line`}
                      stroke="rgba(23, 37, 29, 0.48)"
                      strokeLinecap="round"
                      strokeWidth={1.4}
                      x1={segment.callout.lineX1}
                      y1={segment.callout.lineY1}
                      x2={segment.callout.lineX2}
                      y2={segment.callout.lineY2}
                    />
                  ))}
                  {gradeDistributionSegments.map((segment) => (
                    <SvgText
                      key={`${segment.label}-label`}
                      fill={colors.matteInk}
                      fontFamily={fonts.headingExtra}
                      fontSize="23"
                      letterSpacing="0"
                      x={segment.callout.labelX}
                      y={segment.callout.labelY}
                    >
                      {segment.label}
                    </SvgText>
                  ))}
                </Svg>
              </View>

              <View style={styles.gradeLegendRow}>
                <Text style={styles.gradeLegendText}>48% high range</Text>
                <Text style={styles.gradeLegendText}>36% stable</Text>
                <Text style={styles.gradeLegendText}>16% at risk</Text>
              </View>
            </Card>
          </>
        ) : (
          <Card>
            <Text style={styles.emptyText}>No course data available. Reset courses in the simulator.</Text>
          </Card>
        )}

        <CustomButton
          icon="simulator"
          title="Open What-If Simulator"
          onPress={() => setActiveTab("simulator")}
          style={styles.primaryAction}
        />
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setAlertsVisible(false)}
        transparent
        visible={alertsVisible}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAlertsVisible(false)}>
          <Pressable style={styles.alertSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.alertSheetHandle} />
            <View style={styles.alertSheetHeader}>
              <View>
                <Text style={styles.alertSheetEyebrow}>Attendance Alerts</Text>
                <Text style={styles.alertSheetTitle}>Critical warnings</Text>
              </View>
              <Pressable
                accessibilityLabel="Close attendance alerts"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setAlertsVisible(false)}
                style={styles.alertCloseButton}
              >
                <Text style={styles.alertCloseText}>Close</Text>
              </Pressable>
            </View>

            {lowAttendanceCourses.length > 0 ? (
              <View style={styles.alertList}>
                {lowAttendanceCourses.map((course) => (
                  <View key={course.id} style={styles.alertItem}>
                    <View style={styles.alertItemCodePill}>
                      <Text style={styles.alertItemCode}>{course.shortName}</Text>
                    </View>
                    <Text style={styles.alertItemText}>
                      {course.attendance}% attendance is below the {ATTENDANCE_THRESHOLD}% eligibility threshold.
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.alertEmptyState}>
                <Text style={styles.alertEmptyTitle}>No critical alerts</Text>
                <Text style={styles.alertEmptyText}>Every enrolled course is currently above the attendance threshold.</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  headerBlock: {
    paddingLeft: 20,
    paddingRight: 22,
    paddingVertical: 16,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  eyebrow: {
    color: colors.matteForest,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.headingExtra,
    fontSize: 30,
    lineHeight: 36,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: "100%",
  },
  settingsButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.matteInnerLight,
    borderWidth: 1,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 42,
  },
  notificationButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.matteInnerLight,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    position: "relative",
    shadowColor: colors.matteForest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    width: 46,
    elevation: 3,
    flexShrink: 0,
  },
  notificationButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: colors.criticalText,
    borderColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    minWidth: 22,
    paddingHorizontal: 5,
    position: "absolute",
    right: 2,
    top: 2,
  },
  unreadBadgeText: {
    color: colors.surface,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 13,
  },
  metricStackList: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  metricRowCard: {
    alignItems: "center",
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 0,
    marginVertical: 0,
    minHeight: 112,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: colors.matteForest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  metricRowForest: {
    backgroundColor: colors.matteForest,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  metricRowSage: {
    backgroundColor: colors.matteSage,
    borderColor: "rgba(255, 255, 255, 0.42)",
  },
  metricRowPaper: {
    backgroundColor: colors.surface,
    borderColor: colors.matteInnerDark,
  },
  metricRowLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 14,
    minWidth: 0,
  },
  metricTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  metricIconPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    borderColor: "rgba(255, 255, 255, 0.38)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 54,
  },
  metricIconPillActive: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 54,
  },
  metricLabel: {
    color: colors.matteOliveText,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.15,
    lineHeight: 14,
    marginTop: 2,
    textTransform: "uppercase",
  },
  metricLabelActive: {
    color: "rgba(244, 245, 242, 0.78)",
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 14,
    marginTop: 4,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.matteInk,
    fontFamily: fonts.headingExtra,
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 39,
  },
  metricValueActive: {
    color: colors.surface,
    fontFamily: fonts.headingExtra,
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 39,
  },
  metricHint: {
    color: "rgba(38, 59, 45, 0.72)",
    flexShrink: 0,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 116,
    textAlign: "right",
  },
  metricHintActive: {
    color: "rgba(244, 245, 242, 0.68)",
    flexShrink: 0,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 122,
    textAlign: "right",
  },
  healthPill: {
    backgroundColor: colors.matteMint,
    borderRadius: radii.pill,
    flexShrink: 0,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  healthPillCritical: {
    backgroundColor: colors.criticalBg,
  },
  healthPillText: {
    color: colors.matteForest,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.85,
    textTransform: "uppercase",
  },
  healthPillTextCritical: {
    color: colors.criticalText,
  },
  criticalText: {
    color: colors.criticalText,
  },
  warningCard: {
    backgroundColor: colors.criticalBg,
    shadowColor: colors.criticalText,
  },
  warningTitle: {
    color: colors.criticalText,
    fontFamily: fonts.heading,
    fontSize: 16,
    marginBottom: 8,
  },
  warningRow: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginTop: 7,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  warningCourse: {
    color: colors.criticalText,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    minWidth: 58,
  },
  warningText: {
    color: colors.criticalText,
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  safeCard: {
    backgroundColor: colors.primarySoft,
    shadowColor: colors.matteForest,
  },
  safeTitle: {
    color: colors.matteForest,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginBottom: 4,
  },
  safeText: {
    color: colors.matteForest,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  tickerCard: {
    paddingBottom: 18,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 17,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  tickerList: {
    gap: 10,
  },
  tickerItem: {
    alignItems: "center",
    backgroundColor: colors.matteSurfaceRaised,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tickerIndexCircle: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  tickerIndex: {
    color: colors.matteForest,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  tickerTextBlock: {
    flex: 1,
  },
  announcementLabel: {
    color: colors.matteForest,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginBottom: 3,
  },
  announcementText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  chartCard: {
    overflow: "hidden",
    paddingVertical: 22,
  },
  gradeCard: {
    backgroundColor: colors.mattePaper,
    borderColor: colors.matteInnerLight,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 20,
    paddingTop: 20,
  },
  gradeSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  gradeGaugeWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    borderColor: colors.matteInnerLight,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 10,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  gradeLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
  },
  gradeLegendText: {
    backgroundColor: "rgba(24, 57, 43, 0.06)",
    borderColor: colors.matteInnerLight,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.matteOliveText,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.75,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
    textTransform: "uppercase",
  },
  chart: {
    alignSelf: "center",
    borderRadius: 20,
    marginLeft: -8,
    marginTop: 2,
  },
  modalBackdrop: {
    backgroundColor: "rgba(23, 37, 29, 0.32)",
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  alertSheet: {
    backgroundColor: "#FBF2EE",
    borderColor: "rgba(153, 27, 27, 0.13)",
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowColor: colors.criticalText,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  alertSheetHandle: {
    alignSelf: "center",
    backgroundColor: "rgba(153, 27, 27, 0.18)",
    borderRadius: radii.pill,
    height: 4,
    marginBottom: 14,
    width: 42,
  },
  alertSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  alertSheetEyebrow: {
    color: colors.criticalText,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.05,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  alertSheetTitle: {
    color: "#5C261F",
    fontFamily: fonts.heading,
    fontSize: 19,
  },
  alertCloseButton: {
    backgroundColor: "rgba(255, 255, 255, 0.54)",
    borderColor: "rgba(153, 27, 27, 0.12)",
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  alertCloseText: {
    color: "#5C261F",
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },
  alertList: {
    gap: 10,
  },
  alertItem: {
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderColor: "rgba(153, 27, 27, 0.12)",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  alertItemCodePill: {
    alignItems: "center",
    backgroundColor: colors.criticalBg,
    borderRadius: radii.pill,
    justifyContent: "center",
    minWidth: 58,
    paddingHorizontal: 10,
  },
  alertItemCode: {
    color: colors.criticalText,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  alertItemText: {
    color: "#5C261F",
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  alertEmptyState: {
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderColor: colors.matteInnerLight,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  alertEmptyTitle: {
    color: colors.matteForest,
    fontFamily: fonts.heading,
    fontSize: 16,
    marginBottom: 5,
  },
  alertEmptyText: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryAction: {
    marginHorizontal: 16,
    marginTop: 10,
  },
});
