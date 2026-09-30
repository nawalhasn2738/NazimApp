# Nazim

Nazim is a mobile-first Expo React Native app that helps a university student see how attendance
and scores affect eligibility and GPA, and lets them try "what if" scenarios before they happen.
Built for the "Software for Mobile Devices" Assignment 1 (open-ended, AI-assisted development).

## The problem

Students juggle a 75% attendance-eligibility rule and a target GPA, but the portal only shows
today's numbers. Nazim answers: "If I miss two more classes, am I still eligible?" and "If I score
85% here instead of 78%, what happens to my GPA?"

**Target user:** a university student tracking attendance risk and GPA across the semester.

## App structure

Two views (Home and What-if simulator) switched by one `activeTab` state value, with an animated slide between them. Each view has a fixed **top app bar** (back arrow, title, alerts bell, overflow menu), popover menus, list-style rows and a floating action button. There is **no side or bottom navigation bar** and no navigation library, as the assignment requires.

## Two views

The app has two views switched by a single `activeTab` state value in `App.js`. There is no side
or bottom bar and no navigation library; each view has an in-content button to reach the other.

### Dashboard (`screens/DashboardView.js`)
- **Top bar:** alerts bell with a badge (lists at-risk courses; tap one to simulate it) and an overflow menu.
- **Hero:** on a lavender band, two ring-gauge cards (average attendance with a tick at the 75% requirement, and current GPA out of 4.0), then a stat row: what-if GPA with its difference, courses at risk and course count.
- **Your courses:** one card per course (status tag, name, code, percentage and a progress bar with a tick at the threshold), lowest attendance first. Tapping a card opens the simulator on that course.
- **Floating action button:** "Simulate".
- **Two `react-native-chart-kit` charts**, both computed from the course data:
  - `LineChart`: average attendance after each lecture (`buildAttendanceTrend`).
  - `BarChart`: attendance per course, lowest first, red below the threshold (`buildAttendanceByCourseData`).
  - **Touch interaction:** press or drag across either chart to inspect it. A floating bubble and highlight follow your finger, and a detail panel shows the numbers: for the line chart the lecture, its average, the change from the previous lecture and the strongest and weakest course; for the bar chart the course, classes attended, the gap to the 75% requirement and a shortcut into the simulator. chart-kit has no touch support for bar charts, so `components/InteractiveChart.js` adds a touch layer aligned to chart-kit's own geometry (`utils/chartData.js`).
- **Announcements:** each can be dismissed; when none are left an empty state offers to show them again.
- Loading, storage-error and no-courses states.

### What-If Simulator (`screens/SimulatorView.js`)
- **Sticky result bar** that stays visible while scrolling: current GPA, what-if GPA and the difference.
- **Find a course:** search by name or code, a "below 75% only" filter, and sorting by attendance.
- **Selected course panel** with three in-card tabs (Attendance / Score / Log):
  - *Attendance:* gauge with the threshold tick, big Attend / Miss tiles that add simulated classes (any number; counted, dashed marker, kept separate from real history, undoable) and a recovery plan.
  - *Score:* the expected score with a numeric input plus -5/+5 and validation (empty, non-numeric and out-of-range values each get a message; out-of-range values are adjusted with a notice).
  - *Log:* a per-lecture table with sort and month filter.
- **Add a course:** a validated form (`components/AddCourseModal.js`, rules in `utils/courseForm.js`).
- **Remove a course** and **Reset sample data**, both with a confirmation dialog.

## Responsive layout

On phones both views are a single column. On wide windows (900px and up, e.g. a browser) the content sits in a centered 1180px shell and switches to two columns: the dashboard puts the gauge, courses and announcements on the left and the charts on the right, and the simulator keeps the search and course list in a left rail beside the selected course. The breakpoint lives in `hooks/useLayout.js`.

## Calculations

The GPA is a **mock, linear score-to-4.0 conversion** (`score / 100 x 4`, weighted by credit
hours), not an official university formula. `calculateGpaFromField` in
`hooks/useSimulatorState.js` is the single source of truth: the "current" GPA reads each course's
`currentGrade`, the "what-if" GPA reads `expectedScore`. Recovery plans (classes to attend, classes
that can still be missed, score needed for a 3.5 target) are in the same file.

## Data and persistence

Courses live in `data/mockData.js` and are held in state by `useSimulatorState`. Changes are saved
with AsyncStorage together with a fingerprint of `mockData.js`; if `mockData.js` is edited, the old
save is discarded automatically so the new data always shows. Corrupt or old-format saves are ignored.

## Technology

Expo SDK 57, React Native 0.86, React 19, `react-native-chart-kit` + `react-native-svg`,
`@react-native-async-storage/async-storage`, `@expo/vector-icons` (Ionicons). Plain JavaScript.

## Project structure

```
App.js                       Loads fonts and state, switches between the two views
hooks/useLayout.js           Wide-window breakpoint and shell width
hooks/useSimulatorState.js   Courses, announcements, persistence, GPA and recovery math
data/mockData.js             Sample courses, announcements, ATTENDANCE_THRESHOLD
utils/attendance.js          Attendance calculations, simulated records, search/filter/sort
utils/courseForm.js          Add-course validation and record generation
utils/chartData.js           Data builders for the two charts
screens/                     DashboardView, SimulatorView
components/                  AppBar, MenuSheet, Fab, ScreenTransition, CourseRow, Card, CustomButton, AlertBadge, Icon, OptionChips, PresencePill,
                             ProgressRing, Segmented, ScoreControl, AttendanceLedger, AddCourseModal, ConfirmModal
constants/theme.js           Light "soft cards" theme tokens (colors, fonts, radii, shadow)
```

## Prerequisites

Install these before running the project:

1. **Node.js** (LTS, v20.19 or newer) from https://nodejs.org. This also installs `npm`.
   Check with `node -v` and `npm -v`.
2. **A way to view the app** (pick one):
   - **Web browser** (easiest, nothing else to install), any modern browser works.
   - **Expo Go** app on a phone (Android: Play Store, iOS: App Store). The phone and the computer
     must be on the same Wi-Fi network. Use the Expo Go version that supports SDK 57.
   - **Android Studio emulator** or **Xcode iOS simulator** (macOS only), optional.

No global Expo CLI install is needed; `npx` (bundled with npm) runs it from the project.

## Run

1. Open a terminal in the project folder (the one containing `package.json`).
2. Install dependencies (first time only, needs internet):
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm start
   ```
4. Open the app:
   - **Web:** press `w` in the terminal (or run `npm run web`).
   - **Phone:** scan the QR code shown in the terminal with Expo Go (Android) or the Camera app (iOS).
   - **Emulator:** press `a` (Android) or `i` (iOS simulator), or run `npm run android` / `npm run ios`.

### Troubleshooting

- **Phone can't connect:** make sure both devices are on the same Wi-Fi, or run `npx expo start --tunnel`.
- **Stale cache or odd errors:** run `npx expo start -c` to clear the cache.
- **Install errors:** delete `node_modules` and run `npm install` again.
- **Old saved data showing:** the app keeps changes in local storage; use "Reset sample data" in the app menu.

## Changing things in the viva

- Attendance threshold: `ATTENDANCE_THRESHOLD` in `data/mockData.js`
- Target GPA: `TARGET_GPA` in `hooks/useSimulatorState.js`
- Add a course in code: append `createCourse({...})` to `initialCourses` in `data/mockData.js`
- Sorting/filtering: `filterAndSortCourses` in `utils/attendance.js`
- Chart data: `utils/chartData.js`
