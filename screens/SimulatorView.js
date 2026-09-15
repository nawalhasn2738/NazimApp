import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AlertBadge from "../components/AlertBadge";
import Card from "../components/Card";
import CustomButton from "../components/CustomButton";
import OrganicIcon from "../components/OrganicIcon";
import { colors, fonts, radii } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";

const RECENT_HISTORY_LIMIT = 10;
const SIMULATED_RECORD_ID = "simulated-next-lecture";
const DEFAULT_LECTURE_DURATION = 1.5;
const SUBJECT_SORT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Lowest Attendance", value: "attendanceAsc" },
  { label: "Highest Attendance", value: "attendanceDesc" },
];
const TABLE_SORT_OPTIONS = [
  { label: "Lecture Order", value: "lecture" },
  { label: "Lowest Attendance", value: "attendanceAsc" },
  { label: "Highest Attendance", value: "attendanceDesc" },
];
const ALL_MONTHS = "all";

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function buildInputState(courses) {
  return courses.reduce((values, course) => {
    values[course.id] = String(course.expectedScore);
    return values;
  }, {});
}

function calculateAttendanceFromRecords(records) {
  const classesHeld = records.length;
  const classesAttended = records.filter((record) => record.presence === "P").length;
  const attendance = classesHeld === 0 ? 0 : Math.round((classesAttended / classesHeld) * 100);

  return {
    attendance,
    classesAttended,
    classesHeld,
  };
}

function getRecordMonthKey(record) {
  const [, month, year] = record.date.split("-");
  return month && year ? `${month}-${year}` : "simulated";
}

function getRecordMonthLabel(monthKey) {
  return monthKey === "simulated" ? "Simulated" : monthKey;
}

function getMonthOptions(records) {
  const monthKeys = records.reduce((keys, record) => {
    const monthKey = getRecordMonthKey(record);
    return keys.includes(monthKey) ? keys : [...keys, monthKey];
  }, []);

  return [ALL_MONTHS, ...monthKeys];
}

function getRecordsWithRunningAttendance(records) {
  let attendedCount = 0;

  return records.map((record, index) => {
    attendedCount += record.presence === "P" ? 1 : 0;
    return {
      ...record,
      runningAttendance: Math.round((attendedCount / (index + 1)) * 100),
    };
  });
}

function sortCoursesByAttendance(courses, sortMode) {
  if (sortMode === "attendanceAsc") {
    return [...courses].sort((a, b) => a.attendance - b.attendance);
  }

  if (sortMode === "attendanceDesc") {
    return [...courses].sort((a, b) => b.attendance - a.attendance);
  }

  return courses;
}

function sortAttendanceRecords(records, sortMode, monthFilter) {
  const recordsWithAttendance = getRecordsWithRunningAttendance(records);
  const visibleRecords =
    monthFilter === ALL_MONTHS
      ? recordsWithAttendance
      : recordsWithAttendance.filter((record) => getRecordMonthKey(record) === monthFilter);

  if (sortMode === "attendanceAsc") {
    return [...visibleRecords].sort((a, b) => a.runningAttendance - b.runningAttendance);
  }

  if (sortMode === "attendanceDesc") {
    return [...visibleRecords].sort((a, b) => b.runningAttendance - a.runningAttendance);
  }

  return visibleRecords;
}

function getAttendanceState(attendance) {
  if (attendance < ATTENDANCE_THRESHOLD) {
    return {
      type: "danger",
      message: `Critical: Below ${ATTENDANCE_THRESHOLD}%. Attend upcoming classes to recover eligibility.`,
    };
  }

  return {
    type: "safe",
    message: `On Track: Attendance is at or above the ${ATTENDANCE_THRESHOLD}% requirement.`,
  };
}

function getNextSimulatedRecord(course, presence) {
  return {
    id: `${course.id}-${SIMULATED_RECORD_ID}`,
    lectureNo: course.attendanceRecords.length + 1,
    date: "Simulated",
    durationHours: DEFAULT_LECTURE_DURATION,
    presence,
    isSimulated: true,
  };
}

function upsertSimulatedRecord(course, presence) {
  const simulatedRecordId = `${course.id}-${SIMULATED_RECORD_ID}`;
  const hasSimulatedRecord = course.attendanceRecords.some(
    (record) => record.id === simulatedRecordId || record.isSimulated,
  );
  const attendanceRecords = hasSimulatedRecord
    ? course.attendanceRecords.map((record) =>
        record.id === simulatedRecordId || record.isSimulated
          ? { ...record, id: simulatedRecordId, presence, isSimulated: true }
          : record,
      )
    : [...course.attendanceRecords, getNextSimulatedRecord(course, presence)];

  return {
    attendanceRecords,
    ...calculateAttendanceFromRecords(attendanceRecords),
  };
}

/**
 * @param {{ courses: Array<{ id: string, code: string, name: string, creditHours: number, expectedScore: number, attendance: number, classesHeld: number, classesAttended: number, attendanceRecords: Array<{ id: string, lectureNo: number, date: string, durationHours: number, presence: "P" | "A", isSimulated?: boolean }> }>, isLoading?: boolean, projectedGpa: string, recoveryPlans?: Record<string, { attendanceAction: string, gpaAction: string, classesToRecover: number, requiredScore: number, targetGpa: number }>, resetCourses: () => void, searchQuery?: string, setActiveTab: (tab: "dashboard" | "simulator") => void, storageError?: string | null, updateCourse: (courseId: string, updatedFields: object) => void }} props
 */
export default function SimulatorView({
  courses,
  isLoading = false,
  projectedGpa,
  recoveryPlans = {},
  resetCourses,
  searchQuery = "",
  setActiveTab,
  storageError = null,
  updateCourse,
}) {
  const [scoreInputs, setScoreInputs] = useState(() => buildInputState(courses));
  const [scoreErrors, setScoreErrors] = useState({});
  const [showLowAttendanceOnly, setShowLowAttendanceOnly] = useState(false);
  const [subjectSortMode, setSubjectSortMode] = useState("default");
  const [expandedCourseIds, setExpandedCourseIds] = useState({});
  const [tableSortModes, setTableSortModes] = useState({});
  const [tableMonthFilters, setTableMonthFilters] = useState({});

  useEffect(() => {
    setScoreInputs(buildInputState(courses));
    setScoreErrors({});
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const visibleCourses = showLowAttendanceOnly
      ? courses.filter((course) => course.attendance < ATTENDANCE_THRESHOLD)
      : courses;

    return sortCoursesByAttendance(visibleCourses, subjectSortMode);
  }, [courses, showLowAttendanceOnly, subjectSortMode]);

  const updateExpectedScore = (course, rawValue) => {
    const trimmedValue = rawValue.trim();

    setScoreInputs((currentInputs) => ({
      ...currentInputs,
      [course.id]: rawValue,
    }));

    if (trimmedValue === "") {
      setScoreErrors((currentErrors) => ({
        ...currentErrors,
        [course.id]: "Enter a score from 0 to 100.",
      }));
      return;
    }

    if (!/^\d{1,3}$/.test(trimmedValue)) {
      setScoreErrors((currentErrors) => ({
        ...currentErrors,
        [course.id]: "Use whole numbers only.",
      }));
      return;
    }

    const numericValue = Number(trimmedValue);
    const clampedValue = clampScore(numericValue);

    if (numericValue !== clampedValue) {
      setScoreInputs((currentInputs) => ({
        ...currentInputs,
        [course.id]: String(clampedValue),
      }));
      setScoreErrors((currentErrors) => ({
        ...currentErrors,
        [course.id]: null,
      }));
      updateCourse(course.id, { expectedScore: clampedValue });
      return;
    }

    setScoreErrors((currentErrors) => ({
      ...currentErrors,
      [course.id]: null,
    }));
    updateCourse(course.id, { expectedScore: clampedValue });
  };

  const adjustExpectedScore = (course, amount) => {
    const nextScore = clampScore(course.expectedScore + amount);
    setScoreInputs((currentInputs) => ({
      ...currentInputs,
      [course.id]: String(nextScore),
    }));
    setScoreErrors((currentErrors) => ({
      ...currentErrors,
      [course.id]: null,
    }));
    updateCourse(course.id, { expectedScore: nextScore });
  };

  const simulateMissedClass = (course) => {
    updateCourse(course.id, upsertSimulatedRecord(course, "A"));
  };

  const simulateAttendedClass = (course) => {
    updateCourse(course.id, upsertSimulatedRecord(course, "P"));
  };

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourseIds((currentExpandedIds) => ({
      ...currentExpandedIds,
      [courseId]: !currentExpandedIds[courseId],
    }));
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
  };

  const handleResetMockData = () => {
    setShowLowAttendanceOnly(false);
    setSubjectSortMode("default");
    setExpandedCourseIds({});
    setTableSortModes({});
    setTableMonthFilters({});
    resetCourses();
  };

  const renderPresencePill = (status, key) => (
    <View
      key={key}
      style={[styles.historyPill, status === "P" ? styles.presentPill : styles.absentPill]}
    >
      <Text
        style={[
          styles.historyPillText,
          status === "P" ? styles.presentPillText : styles.absentPillText,
        ]}
      >
        {status}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Loading simulator...</Text>
        <Text style={styles.centerText}>Preparing course scenarios and projected GPA.</Text>
      </View>
    );
  }

  const hasCourses = courses.length > 0;
  const hasVisibleCourses = filteredCourses.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>Nizam-App</Text>
        <Text style={styles.title}>What-If Simulator</Text>
        <Text style={styles.subtitle}>
          Adjust scores, simulate attendance, and review recovery plans instantly.
        </Text>
      </View>

      <Card style={styles.gpaCard}>
        <View style={styles.gpaHeaderRow}>
          <Text style={styles.metricLabel}>Projected GPA</Text>
          <OrganicIcon color={colors.surface} name="chart" size={22} />
        </View>
        <Text style={styles.gpaValue}>{projectedGpa}</Text>
      </Card>

      {storageError ? (
        <Card style={styles.storageWarningCard}>
          <Text style={styles.storageWarningText}>{storageError}</Text>
        </Card>
      ) : null}

      <View style={styles.filterActions}>
        <CustomButton
          icon="filter"
          title={showLowAttendanceOnly ? "Show All Courses" : "Show Low Attendance Only"}
          variant={showLowAttendanceOnly ? "primary" : "secondary"}
          onPress={() => setShowLowAttendanceOnly((currentValue) => !currentValue)}
          style={styles.filterButton}
        />
      </View>

      <View style={styles.sortPanel}>
        <View style={styles.controlLabelRow}>
          <OrganicIcon color={colors.primaryDark} name="sort" size={17} />
          <Text style={styles.controlLabel}>Sort Subjects</Text>
        </View>
        <View style={styles.optionRow}>
          {SUBJECT_SORT_OPTIONS.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => setSubjectSortMode(option.value)}
              style={[
                styles.optionChip,
                subjectSortMode === option.value && styles.optionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  subjectSortMode === option.value && styles.optionChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!hasCourses ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{searchQuery ? "No matching courses" : "No courses available"}</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No courses matched "${searchQuery}". Clear the search or reset mock data.`
              : "There are no courses to simulate. Reset mock data to restore the default course list."}
          </Text>
          <CustomButton icon="reset" title="Reset Mock Data" onPress={handleResetMockData} style={styles.emptyButton} />
        </Card>
      ) : !hasVisibleCourses ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No low-attendance courses</Text>
          <Text style={styles.emptyText}>
            Every course is currently at or above the {ATTENDANCE_THRESHOLD}% attendance threshold.
          </Text>
          <CustomButton
            icon="filter"
            title="Show All Courses"
            variant="secondary"
            onPress={() => setShowLowAttendanceOnly(false)}
            style={styles.emptyButton}
          />
        </Card>
      ) : (
        filteredCourses.map((course) => {
          const attendanceState = getAttendanceState(course.attendance);
          const attendanceRatio = Math.min(course.attendance, 100) / 100;
          const scoreRatio = course.expectedScore / 100;
          const scoreError = scoreErrors[course.id];
          const isExpanded = Boolean(expandedCourseIds[course.id]);
          const recentRecords = course.attendanceRecords.slice(-RECENT_HISTORY_LIMIT);
          const tableSortMode = tableSortModes[course.id] ?? "lecture";
          const tableMonthFilter = tableMonthFilters[course.id] ?? ALL_MONTHS;
          const monthOptions = getMonthOptions(course.attendanceRecords);
          const visibleTableRecords = sortAttendanceRecords(
            course.attendanceRecords,
            tableSortMode,
            tableMonthFilter,
          );
          const recoveryPlan = recoveryPlans[course.id];

          return (
            <Card
              key={course.id}
              style={[attendanceState.type === "danger" && styles.criticalCourseCard]}
            >
              <Pressable
                accessibilityLabel={`Toggle attendance table for ${course.name}`}
                accessibilityRole="button"
                onPress={() => toggleCourseExpansion(course.id)}
                style={({ pressed }) => [styles.courseHeader, pressed && styles.courseHeaderPressed]}
              >
                <View style={styles.courseTitleBlock}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.expandHint}>
                    {isExpanded ? "- Hide attendance table" : "+ View attendance table"}
                  </Text>
                </View>
                <Text style={styles.creditBadge}>{course.creditHours} cr</Text>
              </Pressable>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Attendance {course.attendance}%</Text>
                <Text style={styles.metaText}>
                  {course.classesAttended}/{course.classesHeld} classes
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.attendanceFill,
                    attendanceState.type === "danger" && styles.attendanceFillDanger,
                    { flex: attendanceRatio },
                  ]}
                />
                <View style={{ flex: 1 - attendanceRatio }} />
              </View>

              <AlertBadge type={attendanceState.type} message={attendanceState.message} />

              {recoveryPlan ? (
                <View style={styles.recoveryPanel}>
                  <Text style={styles.recoveryTitle}>Smart Recovery Plan</Text>
                  <Text style={styles.recoveryText}>{recoveryPlan.attendanceAction}</Text>
                  <Text style={styles.recoveryText}>{recoveryPlan.gpaAction}</Text>
                </View>
              ) : null}

              <Text style={styles.historyLabel}>Recent attendance log</Text>
              <View style={styles.historyRow}>
                {recentRecords.length > 0 ? (
                  recentRecords.map((record) =>
                    renderPresencePill(record.presence, `${course.id}-${record.id}`),
                  )
                ) : (
                  <Text style={styles.emptyInlineText}>No attendance records yet.</Text>
                )}
              </View>

              {isExpanded ? (
                <View style={styles.tableBlock}>
                  <Text style={styles.tableTitle}>Subject Attendance Detail</Text>

                  <View style={styles.tableControls}>
                    <View style={styles.controlLabelRow}>
                      <OrganicIcon color={colors.primaryDark} name="sort" size={17} />
                      <Text style={styles.controlLabel}>Sort Lectures</Text>
                    </View>
                    <View style={styles.optionRow}>
                      {TABLE_SORT_OPTIONS.map((option) => (
                        <Pressable
                          accessibilityRole="button"
                          key={option.value}
                          onPress={() =>
                            setTableSortModes((currentModes) => ({
                              ...currentModes,
                              [course.id]: option.value,
                            }))
                          }
                          style={[
                            styles.optionChip,
                            tableSortMode === option.value && styles.optionChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              tableSortMode === option.value && styles.optionChipTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.controlLabelRow}>
                      <OrganicIcon color={colors.primaryDark} name="filter" size={17} />
                      <Text style={styles.controlLabel}>Month Filter</Text>
                    </View>
                    <View style={styles.optionRow}>
                      {monthOptions.map((monthKey) => (
                        <Pressable
                          accessibilityRole="button"
                          key={`${course.id}-${monthKey}`}
                          onPress={() =>
                            setTableMonthFilters((currentFilters) => ({
                              ...currentFilters,
                              [course.id]: monthKey,
                            }))
                          }
                          style={[
                            styles.optionChip,
                            tableMonthFilter === monthKey && styles.optionChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              tableMonthFilter === monthKey && styles.optionChipTextActive,
                            ]}
                          >
                            {monthKey === ALL_MONTHS ? "All Months" : getRecordMonthLabel(monthKey)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.attendanceTable}>
                      <View style={[styles.tableRow, styles.tableHeaderRow]}>
                        <Text style={[styles.tableCell, styles.tableHeaderCell, styles.lectureCell]}>
                          Lecture No
                        </Text>
                        <Text style={[styles.tableCell, styles.tableHeaderCell, styles.dateCell]}>
                          Date
                        </Text>
                        <Text style={[styles.tableCell, styles.tableHeaderCell, styles.durationCell]}>
                          Duration (In Hours)
                        </Text>
                        <Text style={[styles.tableCell, styles.tableHeaderCell, styles.presenceCell]}>
                          Presence
                        </Text>
                      </View>
                      {visibleTableRecords.length > 0 ? (
                        visibleTableRecords.map((record) => (
                          <View key={record.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.tableBodyCell, styles.lectureCell]}>
                            {record.lectureNo}
                          </Text>
                          <Text style={[styles.tableCell, styles.tableBodyCell, styles.dateCell]}>
                            {record.date}
                          </Text>
                          <Text style={[styles.tableCell, styles.tableBodyCell, styles.durationCell]}>
                            {record.durationHours}
                          </Text>
                          <View style={[styles.tableCell, styles.tablePresenceBodyCell, styles.presenceCell]}>
                            {renderPresencePill(record.presence, `${record.id}-presence`)}
                          </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyTableRow}>
                          <Text style={styles.emptyInlineText}>No lectures found for this filter.</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.scoreHeader}>
                <Text style={styles.inputLabel}>Expected Score</Text>
                <Text style={[styles.scoreValue, scoreError && styles.scoreValueError]}>
                  {course.expectedScore}%
                </Text>
              </View>

              <View style={styles.scoreControlRow}>
                <CustomButton
                  title="-5"
                  variant="secondary"
                  onPress={() => adjustExpectedScore(course, -5)}
                  style={styles.stepButton}
                />
                <TextInput
                  keyboardType="number-pad"
                  maxLength={3}
                  onChangeText={(value) => updateExpectedScore(course, value)}
                  placeholder="0-100"
                  placeholderTextColor="#8A958D"
                  style={[styles.scoreInput, scoreError && styles.scoreInputError]}
                  value={scoreInputs[course.id] ?? String(course.expectedScore)}
                />
                <CustomButton
                  title="+5"
                  variant="secondary"
                  onPress={() => adjustExpectedScore(course, 5)}
                  style={styles.stepButton}
                />
              </View>
              {scoreError ? <Text style={styles.errorText}>{scoreError}</Text> : null}

              <View style={styles.progressTrack}>
                <View style={[styles.scoreFill, { flex: scoreRatio }]} />
                <View style={{ flex: 1 - scoreRatio }} />
              </View>

              <View style={styles.buttonRow}>
                <CustomButton
                  icon="miss"
                  title="Miss Class"
                  variant="secondary"
                  onPress={() => simulateMissedClass(course)}
                  style={styles.splitButton}
                />
                <CustomButton
                  icon="attendance"
                  title="Attend Class"
                  variant="secondary"
                  onPress={() => simulateAttendedClass(course)}
                  style={styles.splitButton}
                />
              </View>
            </Card>
          );
        })
      )}

      <View style={styles.footerActions}>
        <CustomButton
          icon="back"
          title="Back to Dashboard"
          onPress={handleBackToDashboard}
          style={styles.footerButton}
        />
        <CustomButton
          icon="reset"
          title="Reset Mock Data"
          variant="secondary"
          onPress={handleResetMockData}
          style={styles.footerButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 42,
    paddingTop: 16,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 20,
    marginBottom: 6,
    textAlign: "center",
  },
  centerText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginTop: 7,
  },
  gpaCard: {
    backgroundColor: colors.primaryDeep,
    shadowColor: colors.primaryDeep,
  },
  gpaHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricLabel: {
    color: "#A7F3D0",
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  storageWarningCard: {
    backgroundColor: colors.warningBg,
    shadowColor: colors.warningText,
  },
  storageWarningText: {
    color: colors.warningText,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
  },
  gpaValue: {
    color: colors.surface,
    fontFamily: fonts.headingExtra,
    fontSize: 38,
    lineHeight: 44,
    marginTop: 4,
  },
  filterActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  filterButton: {
    width: "100%",
  },
  sortPanel: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  tableControls: {
    gap: 8,
    marginBottom: 10,
  },
  controlLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  controlLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textTransform: "uppercase",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDeep,
  },
  optionChipText: {
    color: colors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  optionChipTextActive: {
    color: colors.surface,
  },
  emptyCard: {
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 18,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  emptyInlineText: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  emptyButton: {
    marginTop: 18,
    width: "100%",
  },
  criticalCourseCard: {
    backgroundColor: "#FFF7F7",
    shadowColor: colors.criticalText,
  },
  courseHeader: {
    alignItems: "flex-start",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginHorizontal: -6,
    marginTop: -4,
    minHeight: 54,
    padding: 8,
  },
  courseHeaderPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  courseTitleBlock: {
    flex: 1,
  },
  courseCode: {
    color: colors.primaryDark,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginBottom: 3,
  },
  courseName: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 17,
    lineHeight: 22,
  },
  expandHint: {
    color: colors.textMuted,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    marginTop: 5,
  },
  creditBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    color: colors.primaryDark,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  metaText: {
    color: colors.textMuted,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  progressTrack: {
    backgroundColor: "#E5E7EB",
    borderRadius: radii.pill,
    flexDirection: "row",
    height: 9,
    marginTop: 10,
    overflow: "hidden",
  },
  attendanceFill: {
    backgroundColor: colors.primary,
  },
  attendanceFillDanger: {
    backgroundColor: colors.criticalText,
  },
  recoveryPanel: {
    backgroundColor: colors.blueSoft,
    borderRadius: 18,
    gap: 5,
    marginTop: 16,
    padding: 16,
  },
  recoveryTitle: {
    color: colors.blue,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    textTransform: "uppercase",
  },
  recoveryText: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  historyLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    marginTop: 18,
  },
  historyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  historyPill: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  presentPill: {
    backgroundColor: colors.primarySoft,
    shadowColor: colors.primaryDeep,
  },
  absentPill: {
    backgroundColor: colors.criticalBg,
    shadowColor: colors.criticalText,
  },
  historyPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  presentPillText: {
    color: colors.primaryDark,
  },
  absentPillText: {
    color: colors.criticalText,
  },
  tableBlock: {
    marginTop: 18,
  },
  tableTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    marginBottom: 8,
  },
  attendanceTable: {
    borderColor: "#8EC5FF",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    minWidth: 456,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderRow: {
    backgroundColor: colors.primaryDark,
  },
  emptyTableRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: "#8EC5FF",
    borderRightWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
    width: 456,
  },
  tableCell: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#8EC5FF",
    borderRightWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  tableHeaderCell: {
    color: colors.surface,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  tableBodyCell: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    paddingVertical: 10,
  },
  tablePresenceBodyCell: {
    backgroundColor: colors.surface,
    paddingVertical: 5,
  },
  lectureCell: {
    width: 88,
  },
  dateCell: {
    width: 116,
  },
  durationCell: {
    width: 160,
  },
  presenceCell: {
    width: 92,
  },
  scoreFill: {
    backgroundColor: colors.blue,
  },
  scoreHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  inputLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  scoreValue: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  scoreValueError: {
    color: colors.criticalText,
  },
  scoreControlRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  stepButton: {
    minHeight: 44,
    width: 64,
  },
  scoreInput: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  scoreInputError: {
    borderColor: colors.criticalText,
    borderWidth: 1.5,
  },
  errorText: {
    color: colors.criticalText,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  splitButton: {
    flex: 1,
  },
  footerActions: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerButton: {
    width: "100%",
  },
});
