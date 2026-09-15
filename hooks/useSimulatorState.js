import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATTENDANCE_THRESHOLD, initialCourses } from "../data/mockData";

const STORAGE_KEY = "nazimapp.simulator.v1";
const TARGET_GPA = 3.5;

function cloneCourses(courses) {
  return courses.map((course) => ({
    ...course,
    attendanceRecords: course.attendanceRecords.map((record) => ({ ...record })),
  }));
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

function calculateProjectedGpa(courses) {
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
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreCourses() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (storedValue) {
          const parsedCourses = JSON.parse(storedValue);
          if (isValidStoredCourses(parsedCourses)) {
            setCourses(cloneCourses(parsedCourses));
          }
        }
      } catch (error) {
        if (isMounted) {
          setStorageError("Saved simulator data could not be restored. Using default mock data.");
        }
      } finally {
        if (isMounted) {
          hasRestoredRef.current = true;
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
    if (!hasRestoredRef.current) {
      return;
    }

    async function persistCourses() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
        setStorageError(null);
      } catch (error) {
        setStorageError("Simulator changes could not be saved on this device.");
      }
    }

    persistCourses();
  }, [courses]);

  const projectedGpa = useMemo(() => calculateProjectedGpa(courses), [courses]);
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
  }, []);

  return {
    activeTab,
    courses,
    isRestoring,
    projectedGpa,
    recoveryPlans,
    resetCourses,
    setActiveTab,
    storageError,
    updateCourse,
  };
}
