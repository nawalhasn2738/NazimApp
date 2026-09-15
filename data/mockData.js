/**
 * @typedef {object} AttendanceRecord
 * @property {string} id
 * @property {number} lectureNo
 * @property {string} date
 * @property {number} durationHours
 * @property {"P" | "A"} presence
 * @property {boolean=} isSimulated
 *
 * @typedef {object} Course
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} shortName
 * @property {number} creditHours
 * @property {number} currentGrade
 * @property {number} expectedScore
 * @property {number} attendance
 * @property {number} classesHeld
 * @property {number} classesAttended
 * @property {AttendanceRecord[]} attendanceRecords
 */
export const ATTENDANCE_THRESHOLD = 75;

const baseDates = [
  "17-Aug-2026",
  "19-Aug-2026",
  "24-Aug-2026",
  "31-Aug-2026",
  "02-Sep-2026",
  "07-Sep-2026",
  "09-Sep-2026",
  "14-Sep-2026",
  "16-Sep-2026",
  "21-Sep-2026",
];

function createAttendanceRecords(courseId, statuses) {
  return statuses.map((presence, index) => ({
    id: `${courseId}-lecture-${index + 1}`,
    lectureNo: index + 1,
    date: baseDates[index],
    durationHours: 1.5,
    presence,
  }));
}

function attendancePercent(statuses) {
  const present = statuses.filter((status) => status === "P").length;
  return Math.round((present / statuses.length) * 100);
}

function createCourse({
  id,
  code,
  name,
  shortName,
  creditHours,
  currentGrade,
  expectedScore,
  statuses,
}) {
  const classesAttended = statuses.filter((status) => status === "P").length;

  return {
    id,
    code,
    name,
    shortName,
    creditHours,
    currentGrade,
    expectedScore,
    attendance: attendancePercent(statuses),
    classesHeld: statuses.length,
    classesAttended,
    attendanceRecords: createAttendanceRecords(id, statuses),
  };
}

/** @type {Course[]} */
export const initialCourses = [
  createCourse({
    id: "oop",
    code: "CS-201",
    name: "Object Oriented Programming",
    shortName: "OOP",
    creditHours: 3,
    currentGrade: 78,
    expectedScore: 82,
    statuses: ["P", "P", "A", "P", "P", "A", "P", "P", "P", "P"],
  }),
  createCourse({
    id: "mad",
    code: "CS-406",
    name: "Mobile App Development",
    shortName: "Mobile",
    creditHours: 3,
    currentGrade: 85,
    expectedScore: 88,
    statuses: ["P", "P", "P", "A", "P", "P", "P", "P", "P", "P"],
  }),
  createCourse({
    id: "db",
    code: "CS-303",
    name: "Database Systems",
    shortName: "DB",
    creditHours: 4,
    currentGrade: 65,
    expectedScore: 72,
    statuses: ["A", "P", "A", "P", "A", "P", "P", "A", "P", "P"],
  }),
  createCourse({
    id: "ds",
    code: "MTH-211",
    name: "Discrete Structures",
    shortName: "Discrete",
    creditHours: 3,
    currentGrade: 72,
    expectedScore: 76,
    statuses: ["P", "P", "P", "P", "A", "P", "P", "P", "P", "A"],
  }),
];

export const announcements = [
  {
    id: "a1",
    label: "Midterms",
    text: "Mid-term date sheet has been published on the student portal.",
  },
  {
    id: "a2",
    label: "OOP",
    text: "Assignment 2 deadline extended to Friday at 11:59 PM.",
  },
  {
    id: "a3",
    label: "Database",
    text: "Database quiz has been rescheduled to next Monday.",
  },
];
