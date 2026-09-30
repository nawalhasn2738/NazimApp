import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import MenuSheet from "./components/MenuSheet";
import ScreenTransition from "./components/ScreenTransition";
import useSimulatorState from "./hooks/useSimulatorState";
import DashboardView from "./screens/DashboardView";
import SimulatorView from "./screens/SimulatorView";
import TodayView from "./screens/TodayView";
import { colors } from "./constants/theme";
import { MAX_CONTENT_WIDTH } from "./hooks/useLayout";
import { ATTENDANCE_THRESHOLD } from "./data/mockData";

export default function App() {
  const [dashboardScreen, setDashboardScreen] = useState("today");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    ...Ionicons.font,
  });
  const {
    activeTab,
    addCourse,
    announcements,
    baselineGpa,
    courses,
    dismissAnnouncement,
    focusCourseId,
    gpaDelta,
    isRestoring,
    openSimulator,
    projectedGpa,
    recoveryPlans,
    removeCourse,
    resetCourses,
    restoreAnnouncements,
    setActiveTab,
    storageError,
    updateCourse,
  } = useSimulatorState();

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.brand} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const atRisk = courses.filter((course) => course.attendance < ATTENDANCE_THRESHOLD);
  const openSimulatorScreen = (courseId) => {
    openSimulator(courseId);
  };

  const alertItems = atRisk.length > 0
    ? atRisk.map((course) => ({
        key: course.id,
        icon: "alert",
        label: course.name,
        detail: `${course.attendance}% - below ${ATTENDANCE_THRESHOLD}%`,
        onPress: () => openSimulatorScreen(course.id),
      }))
    : [{ key: "none", icon: "attendance", label: "No alerts", detail: "Every course meets the requirement.", disabled: true }];

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.shell}>
        <ScreenTransition direction={activeTab === "simulator" ? 1 : -1} key={activeTab}>
        {activeTab === "dashboard" && dashboardScreen === "today" ? (
          <TodayView
            alertCount={atRisk.length}
            courses={courses}
            onOpenAlerts={() => setAlertsOpen(true)}
            onOpenAttendance={() => setDashboardScreen("attendance")}
            recoveryPlans={recoveryPlans}
            updateCourse={updateCourse}
          />
        ) : activeTab === "dashboard" ? (
          <DashboardView
            announcements={announcements}
            baselineGpa={baselineGpa}
            courses={courses}
            dismissAnnouncement={dismissAnnouncement}
            gpaDelta={gpaDelta}
            isLoading={isRestoring}
            onBack={() => setDashboardScreen("today")}
            onOpenAlerts={() => setAlertsOpen(true)}
            onOpenSimulator={openSimulatorScreen}
            projectedGpa={projectedGpa}
            recoveryPlans={recoveryPlans}
            restoreAnnouncements={restoreAnnouncements}
            storageError={storageError}
            view="attendance"
          />
        ) : (
          <SimulatorView
            addCourse={addCourse}
            baselineGpa={baselineGpa}
            courses={courses}
            focusCourseId={focusCourseId}
            gpaDelta={gpaDelta}
            isLoading={isRestoring}
            projectedGpa={projectedGpa}
            recoveryPlans={recoveryPlans}
            removeCourse={removeCourse}
            resetCourses={resetCourses}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab !== "simulator") setDashboardScreen("attendance");
            }}
            storageError={storageError}
            updateCourse={updateCourse}
          />
        )}
        </ScreenTransition>
        <MenuSheet items={alertItems} onClose={() => setAlertsOpen(false)} title="Attendance alerts" visible={alertsOpen} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Centered column: full width on phones, capped and centered on wide windows.
  shell: {
    alignSelf: "center",
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
