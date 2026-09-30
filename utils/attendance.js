import { ATTENDANCE_THRESHOLD } from "../data/mockData";

export const ALL_MONTHS = "all";

const SIMULATED_RECORD_ID = "simulated-next-lecture";
const DEFAULT_LECTURE_DURATION = 1.5;

export function formatCourseCode(code) {
  const compact = String(code ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const match = compact.match(/^([A-Z]+)([0-9]+)$/);
  return match ? `${match[1]}-${match[2]}` : compact;
}

export function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

/** Recomputes the three derived attendance numbers from a list of records. */
export function calculateAttendanceFromRecords(records) {
  const classesHeld = records.length;
  const classesAttended = records.filter((record) => record.presence === "P").length;
  const attendance = classesHeld === 0 ? 0 : Math.round((classesAttended / classesHeld) * 100);

  return { attendance, classesAttended, classesHeld };
}

export function getAttendanceState(attendance) {
  if (attendance < ATTENDANCE_THRESHOLD) {
    return {
      type: "danger",
      message: `Below the ${ATTENDANCE_THRESHOLD}% requirement. Attend upcoming classes to recover eligibility.`,
    };
  }

  return {
    type: "safe",
    message: `At or above the ${ATTENDANCE_THRESHOLD}% attendance requirement.`,
  };
}

/* ---------- simulated ("what-if") classes ---------- */

export function countSimulatedRecords(course) {
  return course.attendanceRecords.filter((record) => record.isSimulated).length;
}

/** Appends ONE simulated class; real history is never modified. */
export function addSimulatedRecord(course, presence) {
  const record = {
    id: `${course.id}-${SIMULATED_RECORD_ID}-${countSimulatedRecords(course) + 1}`,
    lectureNo: course.attendanceRecords.length + 1,
    date: "Simulated",
    durationHours: DEFAULT_LECTURE_DURATION,
    presence,
    isSimulated: true,
  };
  const attendanceRecords = [...course.attendanceRecords, record];

  return { attendanceRecords, ...calculateAttendanceFromRecords(attendanceRecords) };
}

/** Drops every simulated record (per-course undo), leaving real history intact. */
export function clearSimulatedRecords(course) {
  const attendanceRecords = course.attendanceRecords.filter((record) => !record.isSimulated);

  return { attendanceRecords, ...calculateAttendanceFromRecords(attendanceRecords) };
}

/** Adds or updates the real attendance record for one scheduled class. */
export function recordAttendanceForDate(course, presence, date) {
  const recordId = `${course.id}-scheduled-${date}`;
  const existing = course.attendanceRecords.find((record) => record.id === recordId);
  const nextRecord = {
    id: recordId,
    lectureNo: existing?.lectureNo ?? course.attendanceRecords.length + 1,
    date,
    durationHours: existing?.durationHours ?? DEFAULT_LECTURE_DURATION,
    presence,
  };
  const attendanceRecords = existing
    ? course.attendanceRecords.map((record) => (record.id === recordId ? nextRecord : record))
    : [...course.attendanceRecords, nextRecord];

  return { attendanceRecords, ...calculateAttendanceFromRecords(attendanceRecords) };
}

/* ---------- ledger helpers (sort / month filter) ---------- */

export function getRecordMonthKey(record) {
  if (record.isSimulated) {
    return "simulated";
  }

  const [, month, year] = record.date.split("-");
  return month && year ? `${month}-${year}` : "manual";
}

export function getRecordMonthLabel(monthKey) {
  if (monthKey === ALL_MONTHS) return "All months";
  if (monthKey === "simulated") return "Simulated";
  if (monthKey === "manual") return "Manual entry";
  return monthKey;
}

export function getMonthOptions(records) {
  const monthKeys = records.reduce((keys, record) => {
    const monthKey = getRecordMonthKey(record);
    return keys.includes(monthKey) ? keys : [...keys, monthKey];
  }, []);

  return [ALL_MONTHS, ...monthKeys];
}

function withRunningAttendance(records) {
  let attendedCount = 0;

  return records.map((record, index) => {
    attendedCount += record.presence === "P" ? 1 : 0;
    return { ...record, runningAttendance: Math.round((attendedCount / (index + 1)) * 100) };
  });
}

export function sortAttendanceRecords(records, sortMode, monthFilter) {
  const withAttendance = withRunningAttendance(records);
  const visible =
    monthFilter === ALL_MONTHS
      ? withAttendance
      : withAttendance.filter((record) => getRecordMonthKey(record) === monthFilter);

  if (sortMode === "attendanceAsc") {
    return [...visible].sort((a, b) => a.runningAttendance - b.runningAttendance);
  }
  if (sortMode === "attendanceDesc") {
    return [...visible].sort((a, b) => b.runningAttendance - a.runningAttendance);
  }
  return visible;
}

/* ---------- course list helpers (search / filter / sort) ---------- */

export function filterAndSortCourses(courses, { query, lowOnly, sortMode }) {
  const needle = query.trim().toLowerCase();
  const visible = courses.filter((course) => {
    const matchesQuery =
      needle === "" ||
      course.name.toLowerCase().includes(needle) ||
      course.code.toLowerCase().includes(needle);
    const matchesLow = !lowOnly || course.attendance < ATTENDANCE_THRESHOLD;
    return matchesQuery && matchesLow;
  });

  if (sortMode === "attendanceAsc") return [...visible].sort((a, b) => a.attendance - b.attendance);
  if (sortMode === "attendanceDesc") return [...visible].sort((a, b) => b.attendance - a.attendance);
  return visible;
}
