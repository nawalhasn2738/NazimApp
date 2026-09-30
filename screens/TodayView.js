import { Bell, Bookmark, CalendarDays, Check, ChevronRight, MapPin, X } from "lucide-react-native";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, courseColors, fonts, radii } from "../constants/theme";
import { formatCourseCode, recordAttendanceForDate } from "../utils/attendance";

const CLASS_DETAILS = [
  { start: "10:00", end: "11:00", room: "Lab 2", subtype: "Class" },
  { start: "10:30", end: "12:00", room: "Room 204", subtype: "Lab" },
  { start: "13:00", end: "14:30", room: "Room 301", subtype: "Exam" },
  { start: "14:00", end: "15:30", room: "Lab 1", subtype: "Class" },
];
const WEEK_START_MINUTES = 9 * 60;
const WEEK_END_MINUTES = 16 * 60;
const HOUR_HEIGHT = 48;
const DAY_WIDTH = 90;

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toRecordDate = (date) => {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${String(date.getDate()).padStart(2, "0")}-${month}-${date.getFullYear()}`;
};

const classesForDate = (date, courses) => {
  if (courses.length === 0) return [];
  const start = date.getDay() % courses.length;
  const dayCourses = [courses[start], courses[(start + 1) % courses.length]]
    .filter((course, index, list) => list.findIndex((item) => item.id === course.id) === index);
  return dayCourses.map((course) => ({
    course,
    detail: CLASS_DETAILS[courses.findIndex((item) => item.id === course.id) % CLASS_DETAILS.length],
  }));
};

function WeekColumn({ dayIndex, children }) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dayIndex}`, data: { dayIndex } });
  return <View ref={setNodeRef} style={[styles.weekColumn, isOver && styles.weekColumnOver]}>{children}</View>;
}

function DraggableCourse({ item, color, conflicted }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.occurrenceId,
    data: item,
  });
  const top = ((toMinutes(item.detail.start) - WEEK_START_MINUTES) / 60) * HOUR_HEIGHT;
  const height = ((toMinutes(item.detail.end) - toMinutes(item.detail.start)) / 60) * HOUR_HEIGHT;
  const dragTransform = transform ? [{ translateX: transform.x }, { translateY: transform.y }] : undefined;

  return (
    <View
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={[styles.weekCourse, conflicted && styles.weekCourseConflict, { borderLeftColor: color, height, top, transform: dragTransform, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.8 : 1 }]}
    >
      <Text numberOfLines={2} style={styles.weekCourseCode}>{formatCourseCode(item.course.code)}</Text>
      <Text style={styles.weekCourseTime}>{item.detail.start}</Text>
    </View>
  );
}

export default function TodayView({ alertCount = 0, courses, recoveryPlans, updateCourse, onOpenAlerts, onOpenAttendance }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date;
  }), []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState("day");
  const [scheduleOverrides, setScheduleOverrides] = useState({});
  const [undoState, setUndoState] = useState(null);
  const transition = useRef(new Animated.Value(1)).current;
  const undoTimer = useRef(null);
  const selectedDate = days[selectedIndex];
  const recordDate = toRecordDate(selectedDate);
  const baseOccurrences = days.flatMap((date, dayIndex) => classesForDate(date, courses).map((item) => ({
    ...item,
    dayIndex,
    occurrenceId: `${dayIndex}-${item.course.id}`,
  })));
  const placedOccurrences = baseOccurrences.map((item) => {
    const override = scheduleOverrides[item.occurrenceId];
    return override ? { ...item, dayIndex: override.dayIndex, detail: { ...item.detail, start: override.start, end: override.end } } : item;
  });
  const weekSchedule = days.map((_, dayIndex) => placedOccurrences.filter((item) => item.dayIndex === dayIndex));
  const scheduledClasses = weekSchedule[selectedIndex];
  const averageAttendance = courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + course.attendance, 0) / courses.length) : 0;
  const atRiskCount = courses.filter((course) => course.attendance < 75).length;
  const overlaps = new Map();
  const weekConflicts = new Set();

  scheduledClasses.forEach((itemA, indexA) => {
    scheduledClasses.forEach((itemB, indexB) => {
      if (indexA >= indexB) return;
      const startA = toMinutes(itemA.detail.start);
      const endA = toMinutes(itemA.detail.end);
      const startB = toMinutes(itemB.detail.start);
      const endB = toMinutes(itemB.detail.end);
      if (startA < endB && startB < endA) {
        overlaps.set(itemA.course.id, itemB);
        overlaps.set(itemB.course.id, itemA);
      }
    });
  });
  weekSchedule.forEach((items) => {
    items.forEach((itemA, indexA) => items.forEach((itemB, indexB) => {
      if (indexA >= indexB) return;
      if (toMinutes(itemA.detail.start) < toMinutes(itemB.detail.end) && toMinutes(itemB.detail.start) < toMinutes(itemA.detail.end)) {
        weekConflicts.add(itemA.occurrenceId);
        weekConflicts.add(itemB.occurrenceId);
      }
    }));
  });

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const changeView = (nextMode) => {
    if (nextMode === viewMode) return;
    transition.setValue(0);
    setViewMode(nextMode);
    Animated.timing(transition, { duration: 200, toValue: 1, useNativeDriver: true }).start();
  };

  const handleDragEnd = ({ active, over, delta }) => {
    if (!over) return;
    const item = active.data.current;
    const duration = toMinutes(item.detail.end) - toMinutes(item.detail.start);
    const rawStart = toMinutes(item.detail.start) + (delta.y / HOUR_HEIGHT) * 60;
    const snappedStart = Math.round(rawStart / 15) * 15;
    const startMinutes = Math.max(WEEK_START_MINUTES, Math.min(WEEK_END_MINUTES - duration, snappedStart));
    const formatTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const previous = scheduleOverrides;
    setScheduleOverrides({
      ...scheduleOverrides,
      [item.occurrenceId]: { dayIndex: over.data.current.dayIndex, start: formatTime(startMinutes), end: formatTime(startMinutes + duration) },
    });
    setUndoState(previous);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoState(null), 5000);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerBar}>
          <Pressable accessibilityLabel={viewMode === "day" ? "Show week view" : "Show day view"} hitSlop={8} onPress={() => changeView(viewMode === "day" ? "week" : "day")} style={styles.headerButton}>
            <CalendarDays color={colors.onBrand} size={20} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Today</Text>
          <Pressable accessibilityLabel="Open attendance alerts" hitSlop={8} onPress={onOpenAlerts} style={styles.headerButton}>
            <Bell color={colors.onBrand} size={20} strokeWidth={2} />
            {alertCount > 0 ? <View style={styles.alertDot}><Text style={styles.alertCount}>{alertCount}</Text></View> : null}
          </Pressable>
        </View>
        <View style={styles.dateStrip}>
          {days.map((date, index) => {
            const selected = index === selectedIndex;
            return (
              <Pressable accessibilityLabel={date.toLocaleDateString("en-US", { dateStyle: "full" })} accessibilityRole="button" accessibilityState={{ selected }} key={date.toISOString()} onPress={() => setSelectedIndex(index)} style={styles.day}>
                <Text style={styles.weekday}>{date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</Text>
                <View style={[styles.dayNumberCircle, selected && styles.daySelected]}>
                  <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>{date.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel="Open attendance summary" accessibilityRole="button" onPress={onOpenAttendance} style={({ pressed }) => [styles.attendanceStrip, pressed && styles.stripPressed]}>
          <View style={styles.attendanceStripCopy}>
            <Text style={styles.attendanceStripTitle}>Attendance</Text>
            <Text style={styles.attendanceStripMeta}>{averageAttendance}% average · {atRiskCount} {atRiskCount === 1 ? "course" : "courses"} at risk</Text>
          </View>
          <ChevronRight color={colors.inkMuted} size={20} strokeWidth={2} />
        </Pressable>
        <Animated.View style={{ opacity: transition, transform: [{ translateX: transition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        {viewMode === "day" ? <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
          <Text style={styles.sectionMeta}>{scheduledClasses.length} classes</Text>
        </View>

        <View style={styles.classList}>
          {scheduledClasses.map(({ course, detail }) => {
            const savedRecord = course.attendanceRecords.find((record) => record.id === `${course.id}-scheduled-${recordDate}`);
            const mark = (presence) => updateCourse(course.id, recordAttendanceForDate(course, presence, recordDate));
            const now = new Date();
            const selectedDayStart = new Date(selectedDate);
            selectedDayStart.setHours(0, 0, 0, 0);
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            const startAt = new Date(selectedDate);
            startAt.setHours(Math.floor(toMinutes(detail.start) / 60), toMinutes(detail.start) % 60, 0, 0);
            const endAt = new Date(selectedDate);
            endAt.setHours(Math.floor(toMinutes(detail.end) / 60), toMinutes(detail.end) % 60, 0, 0);
            const hasStarted = selectedDayStart < todayStart || (selectedDayStart.getTime() === todayStart.getTime() && now >= startAt);
            const isHappeningNow = now >= startAt && now < endAt;
            const isExam = detail.subtype === "Exam";
            const formatDisplayTime = (value) => new Date(`2000-01-01T${value}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            return (
              <View key={course.id} style={[styles.classCard, isHappeningNow && styles.classCardNow]}>
                <View style={styles.timeColumn}>
                  <Text style={styles.startTime}>{formatDisplayTime(detail.start)}</Text>
                  <Text style={styles.endTime}>{formatDisplayTime(detail.end)}</Text>
                </View>
                <View style={[styles.courseLine, { backgroundColor: courseColors[courses.findIndex((item) => item.id === course.id) % courseColors.length] }]} />
                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text numberOfLines={1} style={styles.courseTitle}>{course.name}</Text>
                    {isExam ? <Bookmark color={colors.accent} fill={colors.accent} size={14} strokeWidth={2} /> : null}
                  </View>
                  <Text style={styles.subtype}>{detail.subtype}</Text>
                  <View style={styles.roomRow}>
                    <MapPin color={colors.inkMuted} size={12} strokeWidth={2} />
                    <Text style={styles.room}>{detail.room}</Text>
                  </View>
                </View>
                {hasStarted ? (
                  <View style={styles.actions}>
                    <Pressable accessibilityLabel={`Mark ${course.name} attended`} onPress={() => mark("P")} style={[styles.action, savedRecord?.presence === "P" && styles.actionSelected]}>
                      <Check color={savedRecord?.presence === "P" ? colors.onBrand : colors.inkMuted} size={18} strokeWidth={2.5} />
                    </Pressable>
                    <Pressable accessibilityLabel={`Mark ${course.name} missed`} onPress={() => mark("A")} style={[styles.action, savedRecord?.presence === "A" && styles.actionMissed]}>
                      <X color={savedRecord?.presence === "A" ? colors.onBrand : colors.inkMuted} size={18} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        </> : (
          <ScrollView contentContainerStyle={styles.weekScroller} horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekGrid}>
              <View style={styles.weekHeaderRow}>
                <View style={styles.timeHeader} />
                {days.map((date) => (
                  <View key={date.toISOString()} style={styles.weekDayHeader}>
                    <Text style={styles.weekDayName}>{date.toLocaleDateString("en-US", { weekday: "short" })}</Text>
                    <Text style={styles.weekDayNumber}>{date.getDate()}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.weekBody}>
                <View style={styles.timeAxis}>
                  {Array.from({ length: 8 }, (_, index) => (
                    <Text key={index} style={[styles.timeLabel, { top: index * HOUR_HEIGHT - 7 }]}>{String(9 + index).padStart(2, "0")}:00</Text>
                  ))}
                </View>
                <View style={styles.dayColumns}>
                  {Array.from({ length: 8 }, (_, index) => <View key={index} style={[styles.hourLine, { top: index * HOUR_HEIGHT }]} />)}
                  {Platform.OS === "web" ? (
                    <DndContext onDragEnd={handleDragEnd}>
                      <View style={styles.columnsRow}>
                        {weekSchedule.map((items, dayIndex) => (
                          <WeekColumn dayIndex={dayIndex} key={days[dayIndex].toISOString()}>
                            {items.map((item) => {
                              const courseIndex = courses.findIndex((course) => course.id === item.course.id);
                              return <DraggableCourse color={courseColors[courseIndex % courseColors.length]} conflicted={weekConflicts.has(item.occurrenceId)} item={item} key={item.occurrenceId} />;
                            })}
                          </WeekColumn>
                        ))}
                      </View>
                    </DndContext>
                  ) : weekSchedule.map((items, dayIndex) => (
                    <View key={days[dayIndex].toISOString()} style={styles.weekColumn}>
                      {items.map((item) => {
                        const top = ((toMinutes(item.detail.start) - WEEK_START_MINUTES) / 60) * HOUR_HEIGHT;
                        const height = ((toMinutes(item.detail.end) - toMinutes(item.detail.start)) / 60) * HOUR_HEIGHT;
                        const courseIndex = courses.findIndex((course) => course.id === item.course.id);
                        return (
                          <View key={item.occurrenceId} style={[styles.weekCourse, weekConflicts.has(item.occurrenceId) && styles.weekCourseConflict, { borderLeftColor: courseColors[courseIndex % courseColors.length], height, top }]}>
                            <Text numberOfLines={2} style={styles.weekCourseCode}>{formatCourseCode(item.course.code)}</Text>
                            <Text style={styles.weekCourseTime}>{item.detail.start}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        )}
        </Animated.View>
      </ScrollView>
      {undoState ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Class moved</Text>
          <Pressable onPress={() => {
            setScheduleOverrides(undoState);
            setUndoState(null);
            if (undoTimer.current) clearTimeout(undoTimer.current);
          }} style={styles.toastButton}>
            <Text style={styles.toastButtonText}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { paddingBottom: 32 },
  header: { backgroundColor: colors.header, paddingBottom: 8 },
  headerBar: { alignItems: "center", flexDirection: "row", height: 56, justifyContent: "space-between", paddingHorizontal: 16 },
  headerButton: { alignItems: "center", height: 36, justifyContent: "center", position: "relative", width: 36 },
  headerTitle: { color: colors.onBrand, fontFamily: fonts.heading, fontSize: 20 },
  alertDot: { alignItems: "center", backgroundColor: colors.bad, borderColor: colors.header, borderRadius: radii.pill, borderWidth: 1, height: 16, justifyContent: "center", position: "absolute", right: 0, top: 0, minWidth: 16 },
  alertCount: { color: colors.onBrand, fontFamily: fonts.bodySemi, fontSize: 12 },
  dateStrip: { flexDirection: "row", paddingHorizontal: 8 },
  day: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 52 },
  weekday: { color: colors.accentSoft, fontFamily: fonts.bodyMedium, fontSize: 12 },
  dayNumberCircle: { alignItems: "center", borderRadius: radii.pill, height: 28, justifyContent: "center", width: 28 },
  daySelected: { backgroundColor: colors.card },
  dayNumber: { color: colors.onBrand, fontFamily: fonts.bodySemi, fontSize: 14 },
  dayNumberSelected: { color: colors.accent },
  attendanceStrip: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: 1, flexDirection: "row", marginHorizontal: 16, marginTop: 16, minHeight: 56, padding: 12 },
  attendanceStripCopy: { flex: 1 },
  attendanceStripTitle: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 14 },
  attendanceStripMeta: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  stripPressed: { opacity: 0.8 },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", paddingBottom: 8, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { color: colors.ink, flex: 1, fontFamily: fonts.heading, fontSize: 16 },
  sectionMeta: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  classList: { paddingHorizontal: 16 },
  classCard: { alignItems: "stretch", backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: 1, flexDirection: "row", minHeight: 64, overflow: "hidden" },
  classCardNow: { backgroundColor: colors.accentSoft },
  timeColumn: { justifyContent: "center", paddingHorizontal: 8, width: 76 },
  startTime: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 12 },
  endTime: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  courseLine: { width: 3 },
  cardBody: { flex: 1, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 8 },
  titleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  courseTitle: { color: colors.ink, flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 14 },
  subtype: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 12 },
  roomRow: { alignItems: "center", flexDirection: "row" },
  room: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, marginLeft: 4 },
  actions: { alignItems: "center", flexDirection: "row", gap: 4, paddingRight: 8 },
  action: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  actionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  actionMissed: { backgroundColor: colors.bad, borderColor: colors.bad },
  weekScroller: { paddingBottom: 16, paddingHorizontal: 16, paddingTop: 24 },
  weekGrid: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", width: 44 + DAY_WIDTH * 7 },
  weekHeaderRow: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 52 },
  timeHeader: { width: 44 },
  weekDayHeader: { alignItems: "center", justifyContent: "center", width: DAY_WIDTH },
  weekDayName: { color: colors.inkMuted, fontFamily: fonts.bodySemi, fontSize: 12 },
  weekDayNumber: { color: colors.ink, fontFamily: fonts.heading, fontSize: 14 },
  weekBody: { flexDirection: "row", height: ((WEEK_END_MINUTES - WEEK_START_MINUTES) / 60) * HOUR_HEIGHT },
  timeAxis: { borderRightColor: colors.line, borderRightWidth: StyleSheet.hairlineWidth, position: "relative", width: 44 },
  timeLabel: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, position: "absolute", right: 4 },
  dayColumns: { flexDirection: "row", position: "relative", width: DAY_WIDTH * 7 },
  columnsRow: { flexDirection: "row", height: "100%", width: DAY_WIDTH * 7 },
  weekColumn: { borderRightColor: colors.line, borderRightWidth: StyleSheet.hairlineWidth, position: "relative", width: DAY_WIDTH },
  weekColumnOver: { backgroundColor: colors.accentSoft },
  hourLine: { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, left: 0, position: "absolute", right: 0 },
  weekCourse: { backgroundColor: colors.cardAlt, borderLeftWidth: 3, left: 4, padding: 4, position: "absolute", right: 4 },
  weekCourseConflict: { backgroundColor: colors.warnSoft },
  weekCourseCode: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12 },
  weekCourseTime: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  toast: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.line, borderRadius: radii.control, borderWidth: 1, bottom: 16, flexDirection: "row", justifyContent: "space-between", left: 16, paddingHorizontal: 16, position: "absolute", right: 16, minHeight: 48 },
  toastText: { color: colors.ink, fontFamily: fonts.bodySemi, fontSize: 12 },
  toastButton: { alignItems: "center", justifyContent: "center", minHeight: 40, paddingHorizontal: 8 },
  toastButtonText: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 12 },
});
