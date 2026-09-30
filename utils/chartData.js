import { colors } from "../constants/theme";
import { ATTENDANCE_THRESHOLD } from "../data/mockData";

export function calculateAverageAttendance(courses) {
  if (courses.length === 0) {
    return 0;
  }

  const total = courses.reduce((sum, course) => sum + course.attendance, 0);
  return Math.round(total / courses.length);
}

/**
 * LineChart data: the average attendance % across all courses after each
 * lecture number (1st lecture, 1st-2nd lectures, ...).
 */
export function buildAttendanceTrend(courses) {
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

    return Math.round(courseAverages.reduce((sum, value) => sum + value, 0) / Math.max(courseAverages.length, 1));
  });

  return {
    labels: data.map((_, index) => (index % 2 === 0 ? `L${index + 1}` : "")),
    datasets: [{ data }],
  };
}

/**
 * BarChart data: each course's attendance %, lowest first. Bars under the
 * eligibility threshold are red via chart-kit's per-bar `colors` array.
 */
export function buildAttendanceByCourseData(courses) {
  const sorted = [...courses].sort((a, b) => a.attendance - b.attendance);

  return {
    labels: sorted.map((course) => course.shortName),
    datasets: [
      {
        data: sorted.map((course) => course.attendance),
        colors: sorted.map((course) => {
          const barColor = course.attendance < ATTENDANCE_THRESHOLD ? colors.bad : colors.good;
          return () => barColor;
        }),
      },
    ],
  };
}

/* ---------- touch interaction helpers ---------- */

// react-native-chart-kit's DEFAULT plot padding (it reads style.paddingTop /
// paddingRight, falling back to 16 / 64). Do not pass those in the charts'
// `style`: chart-kit also applies it as real padding and shifts the chart.
const CHART_PADDING_TOP = 16;
const CHART_PADDING_RIGHT = 64;
export const BAR_PERCENTAGE = 0.55;
export const BAR_BASE_WIDTH = 32; // chart-kit draws bars 32px wide, scaled by barPercentage

const plotBottom = (height) => height * 0.75 + CHART_PADDING_TOP;

/** Pixel position of line-chart point `index` (mirrors chart-kit's own math). */
export function getLinePoint(values, index, width, height, min = 0, max = 100) {
  const visibleValue = Math.max(min, Math.min(max, values[index]));
  return {
    x: CHART_PADDING_RIGHT + (index * (width - CHART_PADDING_RIGHT)) / Math.max(values.length, 1),
    y: plotBottom(height) - ((visibleValue - min) / (max - min)) * (plotBottom(height) - CHART_PADDING_TOP),
    plotTop: CHART_PADDING_TOP,
    plotBottom: plotBottom(height),
  };
}

/** Which line-chart point is closest to horizontal touch position `x`. */
export function getLineIndexFromX(count, x, width) {
  if (count === 0) return null;
  const step = (width - CHART_PADDING_RIGHT) / count;
  return Math.max(0, Math.min(count - 1, Math.round((x - CHART_PADDING_RIGHT) / step)));
}

/** Pixel position of bar `index`: its center x, top y, and left edge / width. */
export function getBarPoint(values, index, width, height) {
  const barWidth = BAR_BASE_WIDTH * BAR_PERCENTAGE;
  const column = (width - CHART_PADDING_RIGHT) / values.length;
  const left = CHART_PADDING_RIGHT + index * column + barWidth / 2;
  return {
    x: left + barWidth / 2,
    y: plotBottom(height) - (values[index] / 100) * (plotBottom(height) - CHART_PADDING_TOP),
    barLeft: left,
    barWidth,
    plotTop: CHART_PADDING_TOP,
    plotBottom: plotBottom(height),
  };
}

/** Which bar the horizontal touch position `x` falls on. */
export function getBarIndexFromX(count, x, width) {
  if (count === 0) return null;
  const barWidth = BAR_BASE_WIDTH * BAR_PERCENTAGE;
  const column = (width - CHART_PADDING_RIGHT) / count;
  return Math.max(0, Math.min(count - 1, Math.round((x - CHART_PADDING_RIGHT - barWidth) / column)));
}

/**
 * Details for one point of the trend line: the average after `index + 1`
 * lectures, the change from the previous lecture, and which course is
 * strongest / weakest at that moment.
 */
export function describeLecture(courses, index) {
  const perCourse = courses
    .filter((course) => course.attendanceRecords.length > 0)
    .map((course) => {
      const records = course.attendanceRecords.slice(0, index + 1);
      const present = records.filter((record) => record.presence === "P").length;
      return { name: course.shortName, value: Math.round((present / records.length) * 100) };
    })
    .sort((a, b) => b.value - a.value);
  const series = buildAttendanceTrend(courses).datasets[0].data;

  return {
    lecture: index + 1,
    average: series[index],
    change: index > 0 ? series[index] - series[index - 1] : null,
    best: perCourse[0] ?? null,
    worst: perCourse[perCourse.length - 1] ?? null,
  };
}
