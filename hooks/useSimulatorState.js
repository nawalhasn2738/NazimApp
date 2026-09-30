import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ATTENDANCE_THRESHOLD, announcements as initialAnnouncements, initialCourses } from "../data/mockData";

const STORAGE_KEY = "nazimapp.simulator.v1";
const TARGET_GPA = 3.5;

// Bump this whenever the *shape* of a stored course changes (e.g. a new field
// is added to the Course type). It has nothing to do with the mock data
// values themselves - see mockFingerprint below for that.
const STORAGE_SCHEMA_VERSION = 2;

function cloneCourses(courses) {
  return courses.map((course) => ({
    ...course,
    attendanceRecords: course.attendanceRecords.map((record) => ({ ...record })),
  }));
}

/**
 * A small, non-cryptographic checksum of mockData.js's initialCourses.
 *
 * Why: AsyncStorage remembers whatever the user last simulated. Without this,
 * editing mockData.js (adding a course, changing a grade, etc.) during a viva
 * would have no visible effect, because the app keeps loading the old saved
 * data instead. This fingerprint is recomputed from the current mockData.js
 * every time the app starts and is stored next to the saved courses. If the
 * two fingerprints don't match, mockData.js has changed since the last save,
 * so the stale save is discarded and the fresh mock data is used instead.
 * Normal in-app edits (adjusting a score, simulating a class) never change
 * mockData.js, so they keep persisting exactly as before.
 */
function computeMockDataFingerprint(courses) {
  const signature = JSON.stringify(
    courses.map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      creditHours: course.creditHours,
      currentGrade: course.currentGrade,
      expectedScore: course.expectedScore,
      attendanceRecords: course.attendanceRecords.map((record) => ({
        presence: record.presence,
        date: record.date,
        lectureNo: record.lectureNo,
        durationHours: record.durationHours,
      })),
    })),
  );

  let hash = 0;
  for (let index = 0; index < signature.length; index += 1) {
    hash = (hash * 31 + signature.charCodeAt(index)) | 0;
  }

  return `${courses.length}-${hash}`;
}

function isValidStoredCourses(value) {
  return Array.isArray(value) && value.every(
    (course) =>
      course &&
      typeof course.id === "string" &&
      typeof course.expectedScore === "number" &&
      Array.isArray(course.attendanceRecords),
  );
}

function isValidStoredPayload(value) {
  return (
    value &&
    typeof value === "object" &&
    value.schemaVersion === STORAGE_SCHEMA_VERSION &&
    typeof value.mockFingerprint === "string" &&
    isValidStoredCourses(value.courses)
  );
}

/**
 * A mock, linear score-to-4.0 conversion (percentage / 100 * 4), weighted by
 * credit hours. This is NOT an official university GPA formula - it's a
 * simplified stand-in so the "what-if" math has something consistent to work
 * with. `scoreField` picks which score drives the calculation:
 *  - "currentGrade"  -> the student's actual grade so far (the baseline).
 *  - "expectedScore" -> the score the student is simulating (the projection).
 * This is the single source of truth for both GPA numbers shown in the app.
 */
function calculateGpaFromField(courses, scoreField) {
  if (courses.length === 0) {
    return "0.00";
  }

  const totalCredits = courses.reduce((sum, course) => sum + course.creditHours, 0);
  const weightedPoints = courses.reduce(
    (sum, course) => sum + (course[scoreField] / 100) * 4 * course.creditHours,
    0,
  );

  return totalCredits === 0 ? "0.00" : (weightedPoints / totalCredits).toFixed(2);
}

function calculateClassesToRecover(course) {
  if (course.attendance >= ATTENDANCE_THRESHOLD) {
    return 0;
  }

  const thresholdRatio = ATTENDANCE_THRESHOLD / 100;
  const needed = Math.ceil(
    (thresholdRatio * course.classesHeld - course.classesAttended) / (1 - thresholdRatio),
  );

  return Math.max(0, needed);
}

function calculateSafeMisses(course) {
  let missedClasses = 0;

  while (missedClasses < 100) {
    const nextHeld = course.classesHeld + missedClasses + 1;
    const nextAttendance = Math.round((course.classesAttended / nextHeld) * 100);

    if (nextAttendance < ATTENDANCE_THRESHOLD) {
      return missedClasses;
    }

    missedClasses += 1;
  }

  return missedClasses;
}

function calculateRequiredScoreForTargetGpa(course, courses, targetGpa) {
  const totalCredits = courses.reduce((sum, item) => sum + item.creditHours, 0);
  const otherWeightedPoints = courses.reduce((sum, item) => {
    if (item.id === course.id) {
      return sum;
    }

    return sum + (item.expectedScore / 100) * 4 * item.creditHours;
  }, 0);
  const targetWeightedPoints = targetGpa * totalCredits;
  const requiredScore = ((targetWeightedPoints - otherWeightedPoints) / (4 * course.creditHours)) * 100;

  return Math.ceil(requiredScore);
}

function buildRecoveryPlans(courses) {
  return courses.reduce((plans, course) => {
    const classesToRecover = calculateClassesToRecover(course);
    const requiredScore = calculateRequiredScoreForTargetGpa(course, courses, TARGET_GPA);
    const safeMisses = course.attendance >= ATTENDANCE_THRESHOLD ? calculateSafeMisses(course) : 0;

    plans[course.id] = {
      attendanceAction:
        classesToRecover > 0
          ? `Attend the next ${classesToRecover} class${classesToRecover === 1 ? "" : "es"} to reach ${ATTENDANCE_THRESHOLD}%+ attendance.`
          : `You can miss ${safeMisses} class${safeMisses === 1 ? "" : "es"} before dropping below ${ATTENDANCE_THRESHOLD}%.`,
      classesToRecover,
      safeMisses,
      gpaAction:
        requiredScore > 100
          ? `A ${TARGET_GPA.toFixed(1)} GPA target is not reachable from this course alone.`
          : requiredScore <= course.expectedScore
            ? `Your current ${course.expectedScore}% expectation supports a ${TARGET_GPA.toFixed(1)} target GPA.`
            : `Raise expected score to at least ${requiredScore}% to support a ${TARGET_GPA.toFixed(1)} target GPA.`,
      requiredScore: Math.max(0, requiredScore),
      targetGpa: TARGET_GPA,
    };

    return plans;
  }, {});
}

export function createInitialCourses() {
  return cloneCourses(initialCourses);
}

export default function useSimulatorState() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [courses, setCourses] = useState(createInitialCourses);
  const [isRestoring, setIsRestoring] = useState(true);
  const [storageError, setStorageError] = useState(null);
  const [focusCourseId, setFocusCourseId] = useState(null);
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function restoreCourses() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (storedValue) {
          const parsedPayload = JSON.parse(storedValue);
          const currentFingerprint = computeMockDataFingerprint(initialCourses);

          if (isValidStoredPayload(parsedPayload) && parsedPayload.mockFingerprint === currentFingerprint) {
            // Saved data matches the current mockData.js - restore it.
            setCourses(cloneCourses(parsedPayload.courses));
          }
          // Otherwise mockData.js has changed (or the save is from an older,
          // incompatible app version) since this was saved, so the stale save
          // is silently ignored and the fresh mock data already in state is
          // kept. Nothing can crash: isValidStoredPayload rejects any shape
          // it doesn't recognize.
        }
      } catch (error) {
        if (isMounted) {
          setStorageError("Saved simulator data could not be restored. Using default mock data.");
        }
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    }

    restoreCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Skip while the initial AsyncStorage read is still in flight so we never
    // overwrite a real saved payload with the placeholder initial state. Once
    // restoring finishes this also runs immediately (not just on the next
    // edit), so a fresh install saves its fingerprint right away instead of
    // waiting for the user's first change.
    if (isRestoring) {
      return;
    }

    async function persistCourses() {
      try {
        const payload = {
          schemaVersion: STORAGE_SCHEMA_VERSION,
          mockFingerprint: computeMockDataFingerprint(initialCourses),
          courses,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setStorageError(null);
      } catch (error) {
        setStorageError("Simulator changes could not be saved on this device.");
      }
    }

    persistCourses();
  }, [courses, isRestoring]);

  // Baseline: where the student actually stands right now (currentGrade).
  // Projected: the what-if result from the scores being simulated (expectedScore).
  const baselineGpa = useMemo(() => calculateGpaFromField(courses, "currentGrade"), [courses]);
  const projectedGpa = useMemo(() => calculateGpaFromField(courses, "expectedScore"), [courses]);
  const gpaDelta = useMemo(() => (Number(projectedGpa) - Number(baselineGpa)).toFixed(2), [projectedGpa, baselineGpa]);
  const recoveryPlans = useMemo(() => buildRecoveryPlans(courses), [courses]);

  const updateCourse = useCallback((courseId, updatedFields) => {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId ? { ...course, ...updatedFields } : course,
      ),
    );
  }, []);

  const resetCourses = useCallback(() => {
    setCourses(createInitialCourses());
    setFocusCourseId(null);
  }, []);

  const addCourse = useCallback((course) => {
    setCourses((currentCourses) => [...currentCourses, course]);
  }, []);

  const removeCourse = useCallback((courseId) => {
    setCourses((currentCourses) => currentCourses.filter((course) => course.id !== courseId));
  }, []);

  // Switches to the simulator; when a course id is given, that course is
  // pre-selected there (used by the dashboard's "needs attention" cards).
  const openSimulator = useCallback((courseId = null) => {
    setFocusCourseId(courseId);
    setActiveTab("simulator");
  }, []);

  const announcements = useMemo(
    () => initialAnnouncements.filter((item) => !dismissedAnnouncementIds.includes(item.id)),
    [dismissedAnnouncementIds],
  );

  const dismissAnnouncement = useCallback((announcementId) => {
    setDismissedAnnouncementIds((currentIds) => [...currentIds, announcementId]);
  }, []);

  const restoreAnnouncements = useCallback(() => {
    setDismissedAnnouncementIds([]);
  }, []);

  return {
    activeTab,
    addCourse,
    announcements,
    baselineGpa,
    courses,
    dismissAnnouncement,
    focusCourseId,
    gpaDelta,
    openSimulator,
    removeCourse,
    restoreAnnouncements,
    isRestoring,
    projectedGpa,
    recoveryPlans,
    resetCourses,
    setActiveTab,
    storageError,
    updateCourse,
  };
}
