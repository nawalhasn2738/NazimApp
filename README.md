# Nazim

Nazim is a mobile-first attendance planner built with Expo and React Native. It helps students review their timetable, record attendance, spot courses below the 75% requirement, and simulate the effect of attending or missing future classes.

## Features

### Today

- Seven-day date strip with day and week timetable views
- Time-ordered class rows with course indicators, rooms, and class types
- Attend and miss controls for classes that have started
- Current-class highlighting
- Timetable overlap detection
- Web week-view drag and drop with 15-minute snapping and undo
- Dynamic week range with a sticky time column
- Attendance summary and alert popover

### Attendance

- At-risk courses shown as expanded cards
- Recovery guidance: `Attend next X classes to reach 75%`
- On-track courses shown as compact rows
- Safe-miss calculation based on current attendance history
- Direct course links into the Simulator
- Slider-style progress indicator with a marked 75% requirement
- Validated Add Course bottom sheet with duplicate-code and attendance checks
- Line chart showing the average attendance trend by lecture
- Per-course bar chart with live 75% status colors, touch details, and overflow scrolling

### Simulator

- Horizontally scrollable course selector
- Animated open-arc attendance gauge
- Attendance-history dot strip
- Safe-to-miss count
- Attend and Miss simulation controls
- Per-course reset

## Attendance calculations

The attendance requirement is 75%.

```text
Safe misses = floor((4 × attended − 3 × total) / 3), minimum 0
Classes needed to recover = 3 × total − 4 × attended
```

When a course has no recorded classes, the app displays `No classes yet`.

## Technology

- Expo SDK 57
- React 19 and React Native 0.86
- React Native Web
- React Native SVG
- React Native Chart Kit
- Lucide and Ionicons
- AsyncStorage
- `@dnd-kit/core` for web timetable dragging

## Requirements

- Node.js 20 or newer
- npm
- Expo Go on an Android or iOS phone, or a modern web browser

## Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/nawalhasn2738/NazimApp.git
cd NazimApp
npm install
```

## Run on a phone

Install Expo Go on the phone and connect the phone and computer to the same Wi-Fi network. From the project directory, run:

```bash
npx expo start --lan --clear
```

Scan the QR code printed in the terminal and keep the terminal running while using the app.

Tunnel mode can be used when the devices cannot share a local network, although it depends on the external ngrok service:

```bash
npx expo start --tunnel --clear
```

## Run on web

```bash
npm run web
```

Expo normally serves the web app at `http://localhost:8081`.

## Other commands

```bash
npm start          # Start Expo interactively
npm run android    # Open on Android
npm run ios        # Open on iOS (macOS required for the simulator)
npm run lint       # Run Expo linting
npx expo-doctor    # Validate Expo configuration and dependencies
```

## Project structure

```text
App.js                         App shell and three-screen navigation
screens/TodayView.js           Day/week timetable and attendance entry
screens/DashboardView.js       Attendance overview
screens/SimulatorView.js       Attendance simulator
components/AttendanceGauge.js  Animated SVG gauge
components/AddCourseModal.js   Validated course-entry bottom sheet
components/CourseRow.js        Compact and expanded attendance rows
components/MenuSheet.js        Alerts popover
components/                    Shared interface components
hooks/useSimulatorState.js     State, persistence, and derived calculations
data/mockData.js               Sample courses and attendance records
utils/attendance.js            Attendance helpers
utils/courseForm.js            Course-form validation and course creation
constants/theme.js             Design tokens
.cursorrules                    Project design constraints
```

## Data persistence

Attendance and simulator changes are stored locally with AsyncStorage. The sample data lives in `data/mockData.js`. This project does not require a backend or an account.

## Design constraints

The interface is capped at 480px and centered on larger displays. It uses three screens only—Today, Attendance, and Simulator—with alerts presented as a popover. The detailed color, typography, spacing, and component rules are documented in `.cursorrules`.

## License

See [LICENSE](LICENSE).
