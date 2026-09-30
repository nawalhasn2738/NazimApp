const MONTHS = ["Sep", "Oct", "Nov", "Dec"];

/**
 * Validates the raw strings from the Add Course form.
 * Returns { errors, course } - `course` is only set when there are no errors.
 */
export function validateNewCourse(values, existingCourses) {
  const errors = {};
  const code = values.code.trim();
  const name = values.name.trim();

  if (code === "") {
    errors.code = "Enter a course code, e.g. CS-350.";
  } else if (existingCourses.some((course) => course.code.toLowerCase() === code.toLowerCase())) {
    errors.code = "A course with this code already exists.";
  }

  if (name.length < 3) {
    errors.name = "Enter the course name (at least 3 characters).";
  }

  const wholeNumber = (text) => /^\d{1,3}$/.test(text.trim());

  if (!wholeNumber(values.creditHours) || Number(values.creditHours) < 1 || Number(values.creditHours) > 6) {
    errors.creditHours = "Credit hours must be a whole number from 1 to 6.";
  }

  ["currentGrade", "expectedScore"].forEach((field) => {
    if (!wholeNumber(values[field]) || Number(values[field]) > 100) {
      errors[field] = "Enter a whole number from 0 to 100.";
    }
  });

  if (!wholeNumber(values.classesHeld) || Number(values.classesHeld) < 1 || Number(values.classesHeld) > 60) {
    errors.classesHeld = "Classes held must be a whole number from 1 to 60.";
  }

  if (!wholeNumber(values.classesAttended)) {
    errors.classesAttended = "Enter how many classes you attended.";
  } else if (!errors.classesHeld && Number(values.classesAttended) > Number(values.classesHeld)) {
    errors.classesAttended = "Attended classes cannot exceed classes held.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, course: null };
  }

  return { errors, course: buildCourse(values, existingCourses) };
}

/** Spreads the absences evenly so the attendance trend chart looks natural. */
function buildStatuses(held, attended) {
  return Array.from({ length: held }, (_, index) =>
    Math.floor(((index + 1) * attended) / held) > Math.floor((index * attended) / held) ? "P" : "A",
  );
}

function buildCourse(values, existingCourses) {
  const held = Number(values.classesHeld);
  const attended = Number(values.classesAttended);
  const code = values.code.trim();
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
    creditHours: Number(values.creditHours),
    currentGrade: Number(values.currentGrade),
    expectedScore: Number(values.expectedScore),
    attendance: Math.round((attended / held) * 100),
    classesHeld: held,
    classesAttended: attended,
    attendanceRecords,
  };
}
