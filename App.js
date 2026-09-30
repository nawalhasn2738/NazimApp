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

  const alertItems = courses
    .filter((course) => course.attendance < ATTENDANCE_THRESHOLD || recoveryPlans[course.id]?.safeMisses === 0)
    .map((course) => {
      const isRisk = course.attendance < ATTENDANCE_THRESHOLD;
      const classesToRecover = Math.max(0, 3 * course.classesHeld - 4 * course.classesAttended);
      return {
        key: course.id,
        label: course.name,
        detail: isRisk
          ? `Attend next ${classesToRecover} class${classesToRecover === 1 ? "" : "es"} to reach 75%`
          : "0 safe misses left",
        isRisk,
        onPress: () => openSimulatorScreen(course.id),
      };
    });

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
        <MenuSheet items={alertItems} newCount={atRisk.length} onClose={() => setAlertsOpen(false)} visible={alertsOpen} />
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
