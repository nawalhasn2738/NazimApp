# NazimApp

Single-screen Expo React Native assignment app for academic analytics and what-if GPA/attendance simulation.

## Run

```bash
npm install
npm start
```

Scan the Expo QR code with Expo Go, or press `w` for the web preview.

## Current App Flow

- `App.js` stores course state and `activeTab`.
- `DashboardView` shows GPA, credits, average attendance, announcements, and charts.
- `SimulatorView` validates expected marks, simulates missed/attended classes, and shows attendance warning badges.
- `Card`, `CustomButton`, and `AlertBadge` are reusable UI components.