import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { announcements } from "./data/mockData";
import useSimulatorState from "./hooks/useSimulatorState";
import DashboardView from "./screens/DashboardView";
import SimulatorView from "./screens/SimulatorView";
import { colors } from "./constants/theme";

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const {
    activeTab,
    courses,
    isRestoring,
    projectedGpa,
    recoveryPlans,
    resetCourses,
    setActiveTab,
    storageError,
    updateCourse,
  } = useSimulatorState();

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
        <StatusBar style="dark" />
        {activeTab === "dashboard" ? (
          <DashboardView
            announcements={announcements}
            courses={courses}
            setActiveTab={setActiveTab}
          />
        ) : (
          <SimulatorView
            courses={courses}
            isLoading={isRestoring}
            projectedGpa={projectedGpa}
            recoveryPlans={recoveryPlans}
            resetCourses={resetCourses}
            setActiveTab={setActiveTab}
            storageError={storageError}
            updateCourse={updateCourse}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
