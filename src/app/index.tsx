import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { initialCourses } from "../../data/mockData";
import DashboardView from "../../screens/DashboardView";
import SimulatorView from "../../screens/SimulatorView";

export default function App() {
  const [courses, setCourses] = useState(initialCourses);
  const [activeTab, setActiveTab] = useState("dashboard");

  const updateCourse = (id, updatedFields) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
    );
  };

  const removeCourse = (id) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === "dashboard" ? (
        <DashboardView courses={courses} setActiveTab={setActiveTab} />
      ) : (
        <SimulatorView
          courses={courses}
          updateCourse={updateCourse}
          removeCourse={removeCourse}
          setActiveTab={setActiveTab}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7F5" },
});
