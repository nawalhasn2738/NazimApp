const MONTHS = ["Sep", "Oct", "Nov", "Dec"];
const COURSE_CODE_PATTERN = /^[A-Z]{2,4}-[0-9]{3}$/;

export function validateNewCourse(values, existingCourses) {
  const errors = {};
  const code = values.code.trim();
  const name = values.name.trim();
  const attendedText = values.classesAttended.trim();
  const totalText = values.classesHeld.trim();
  const wholeNumber = (text) => /^[0-9]+$/.test(text);

  if (!COURSE_CODE_PATTERN.test(code)) {
    errors.code = "Use a format like CS-410.";
  } else if (existingCourses.some((course) => course.code.toLowerCase() === code.toLowerCase())) {
    errors.code = "This course already exists.";
  }

  if (name.length < 2 || name.length > 40) {
    errors.name = "Enter 2 to 40 characters.";
  }

  if (!wholeNumber(attendedText) || Number(attendedText) < 0 || Number(attendedText) > 100) {
    errors.classesAttended = "Enter a whole number from 0 to 100.";
  }

  if (!wholeNumber(totalText) || Number(totalText) < 0 || Number(totalText) > 100) {
    errors.classesHeld = "Enter a whole number from 0 to 100.";
  }

  if (!errors.classesAttended && !errors.classesHeld && Number(attendedText) > Number(totalText)) {
    errors.classesAttended = "Attended can't be more than total.";
  }

  if (Object.keys(errors).length > 0) return { errors, course: null };
  return { errors, course: buildCourse(values, existingCourses) };
}

function buildStatuses(held, attended) {
  return Array.from({ length: held }, (_, index) =>
    Math.floor(((index + 1) * attended) / held) > Math.floor((index * attended) / held) ? "P" : "A",
  );
}

function buildCourse(values, existingCourses) {
  const held = Number(values.classesHeld);
  const attended = Number(values.classesAttended);
  const code = values.code.trim().toUpperCase();
  const name = values.name.trim();
  const id = `custom-${Date.now()}-${existingCourses.length}`;
  const attendanceRecords = buildStatuses(held, attended).map((presence, index) => ({
    id: `${id}-lecture-${index + 1}`,
    lectureNo: index + 1,
    date: `${String((index % 28) + 1).padStart(2, "0")}-${MONTHS[Math.floor(index / 28) % MONTHS.length]}-2026`,
    durationHours: 1.5,
    presence,
  }));

  return {
    id,
    code,
    name,
    shortName: name.split(" ")[0].slice(0, 8),
    creditHours: 3,
    currentGrade: 0,
    expectedScore: 0,
    attendance: held === 0 ? 0 : Math.round((attended / held) * 100),
    classesHeld: held,
    classesAttended: attended,
    attendanceRecords,
  };
}
