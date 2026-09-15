import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
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

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  barPercentage: 0.6,
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
  decimalPlaces: 0,
  fillShadowGradient: colors.primary,
  fillShadowGradientOpacity: 0.9,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  propsForBackgroundLines: {
    stroke: "#EEF2F7",
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
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 48, 450), 300);

  const cumulativeGpa = calculateGpa(courses);
  const totalCredits = courses.reduce((sum, course) => sum + course.creditHours, 0);
  const averageAttendance = calculateAverageAttendance(courses);
  const lowAttendanceCourses = courses.filter((course) => course.attendance < ATTENDANCE_THRESHOLD);
  const healthLabel = lowAttendanceCourses.length > 0 ? `${lowAttendanceCourses.length} critical` : "On track";

  const gradeData = {
    labels: courses.map((course) => course.shortName),
    datasets: [{ data: courses.map((course) => course.expectedScore) }],
  };
  const attendanceTrendData = buildAttendanceTrend(courses);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBlock}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.eyebrow}>Nizam-App</Text>
            <Text style={styles.title}>Analytics Dashboard</Text>
          </View>
          <View style={styles.settingsButton}>
            <OrganicIcon color={colors.primaryDark} name="settings" size={23} />
          </View>
        </View>
        <Text style={styles.subtitle}>A clean academic dashboard for GPA planning, attendance risk, and what-if decisions.</Text>
      </View>

      <View style={styles.filterBar}>
        <View style={styles.filterPill}>
          <OrganicIcon color={colors.primaryDark} name="filter" size={17} />
          <Text style={styles.filterPillText}>All Classes</Text>
        </View>
        <View style={styles.filterPill}>
          <OrganicIcon color={colors.primaryDark} name="trend" size={17} />
          <Text style={styles.filterPillText}>Last 30 Days</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Card style={[styles.metricCard, styles.metricCardActive]}>
          <View style={styles.metricIconBubbleActive}>
            <OrganicIcon color={colors.surface} name="chart" size={22} />
          </View>
          <Text style={styles.metricValueActive}>{cumulativeGpa}</Text>
          <Text style={styles.metricLabelActive}>Cumulative GPA</Text>
        </Card>
        <Card style={styles.metricCard}>
          <View style={styles.metricIconBubble}>
            <OrganicIcon color={colors.primaryDark} name="credits" size={22} />
          </View>
          <Text style={styles.metricValue}>{totalCredits}</Text>
          <Text style={styles.metricLabel}>Enrolled Credits</Text>
          <Text style={styles.metricHint}>{courses.length} active subjects</Text>
        </Card>
        <Card style={styles.metricCardWide}>
          <View style={styles.metricIconBubble}>
            <OrganicIcon color={colors.primaryDark} name="attendance" size={22} />
          </View>
          <Text style={styles.metricLabel}>Attendance Health</Text>
          <View style={styles.healthRow}>
            <Text
              style={[
                styles.metricValue,
                averageAttendance < ATTENDANCE_THRESHOLD && styles.criticalText,
              ]}
            >
              {averageAttendance}%
            </Text>
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
          </View>
        </Card>
      </View>

      {lowAttendanceCourses.length > 0 ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Critical Attendance Alert</Text>
          {lowAttendanceCourses.map((course) => (
            <View key={course.id} style={styles.warningRow}>
              <Text style={styles.warningCourse}>{course.shortName}</Text>
              <Text style={styles.warningText}>
                {course.attendance}% is below the {ATTENDANCE_THRESHOLD}% eligibility threshold.
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.safeCard}>
          <Text style={styles.safeTitle}>ON TRACK</Text>
          <Text style={styles.safeText}>Every enrolled course is currently above the attendance threshold.</Text>
        </Card>
      )}

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

          <Card style={styles.chartCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Course Grade Distribution</Text>
              <Text style={styles.sectionMeta}>0-100%</Text>
            </View>
            <BarChart
              chartConfig={chartConfig}
              data={gradeData}
              fromZero
              height={230}
              showValuesOnTopOfBars
              style={styles.chart}
              verticalLabelRotation={0}
              width={chartWidth}
              yAxisInterval={1}
              yAxisLabel=""
              yAxisSuffix="%"
            />
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
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.primaryDark,
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
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  settingsButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 42,
  },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  filterPill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillText: {
    color: colors.primaryDeep,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  metricCard: {
    flexBasis: "45%",
    flexGrow: 1,
    marginHorizontal: 8,
    minHeight: 154,
    padding: 24,
  },
  metricCardActive: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primaryDeep,
  },
  metricCardWide: {
    flexBasis: "100%",
    marginHorizontal: 8,
    padding: 24,
  },
  metricIconBubble: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: "center",
    marginBottom: 12,
    width: 40,
  },
  metricIconBubbleActive: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.pill,
    height: 40,
    justifyContent: "center",
    marginBottom: 12,
    width: 40,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
  },
  metricLabelActive: {
    color: "#D1FAE5",
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.text,
    fontFamily: fonts.headingExtra,
    fontSize: 34,
    lineHeight: 40,
  },
  metricValueActive: {
    color: colors.surface,
    fontFamily: fonts.headingExtra,
    fontSize: 34,
    lineHeight: 40,
  },
  metricHint: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  healthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  healthPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  healthPillCritical: {
    backgroundColor: colors.criticalBg,
  },
  healthPillText: {
    color: colors.primaryDark,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
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
    shadowColor: colors.primaryDeep,
  },
  safeTitle: {
    color: colors.primaryDark,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginBottom: 4,
  },
  safeText: {
    color: colors.primaryDeep,
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
    backgroundColor: colors.surfaceMuted,
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
    color: colors.primaryDark,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  tickerTextBlock: {
    flex: 1,
  },
  announcementLabel: {
    color: colors.primaryDark,
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
  chart: {
    alignSelf: "center",
    borderRadius: 20,
    marginLeft: -8,
    marginTop: 2,
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
