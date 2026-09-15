import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import AlertBadge from '../components/AlertBadge';
import { ATTENDANCE_THRESHOLD } from '../data/mockData';

export default function SimulatorView({ courses, updateCourse, removeCourse, setActiveTab }) {
  const [inputValues, setInputValues] = useState({});
  const [errors, setErrors] = useState({});

  const handleMarksChange = (courseId, text) => {
    setInputValues((prev) => ({ ...prev, [courseId]: text }));

    const numeric = Number(text);
    if (text.trim() === '') {
      setErrors((prev) => ({ ...prev, [courseId]: null }));
      return;
    }
    if (isNaN(numeric)) {
      setErrors((prev) => ({ ...prev, [courseId]: 'Enter a valid number' }));
      return;
    }
    if (numeric < 0 || numeric > 100) {
      setErrors((prev) => ({ ...prev, [courseId]: 'Enter a value between 0 and 100' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [courseId]: null }));
    updateCourse(courseId, { currentGrade: numeric });
  };

  const simulateSkipClass = (course) => {
    const newHeld = course.classesHeld + 1;
    const newAttendance = Math.round((course.classesAttended / newHeld) * 100);
    updateCourse(course.id, { classesHeld: newHeld, attendance: newAttendance });
  };

  const simulateAttendClass = (course) => {
    const newHeld = course.classesHeld + 1;
    const newAttended = course.classesAttended + 1;
    const newAttendance = Math.round((newAttended / newHeld) * 100);
    updateCourse(course.id, {
      classesHeld: newHeld,
      classesAttended: newAttended,
      attendance: newAttendance,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>What-If Simulator</Text>

      {courses.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No courses to simulate. All courses removed.</Text>
        </Card>
      ) : (
        courses.map((course) => {
          const belowThreshold = course.attendance < ATTENDANCE_THRESHOLD;
          const nearThreshold =
            !belowThreshold && course.attendance < ATTENDANCE_THRESHOLD + 5;

          return (
            <Card key={course.id}>
              <Text style={styles.courseName}>{course.name}</Text>
              <Text style={styles.meta}>
                Credit Hours: {course.creditHours} | Attendance: {course.attendance}%
              </Text>

              {belowThreshold ? (
                <AlertBadge
                  type="danger"
                  message={`Below ${ATTENDANCE_THRESHOLD}% threshold. Attend upcoming classes.`}
                />
              ) : nearThreshold ? (
                <AlertBadge
                  type="warning"
                  message={`Close to the ${ATTENDANCE_THRESHOLD}% threshold. One more miss could put you at risk.`}
                />
              ) : (
                <AlertBadge type="safe" message="Attendance is healthy." />
              )}

              <Text style={styles.inputLabel}>Simulate Expected Marks (0-100)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder={`Current: ${course.currentGrade}`}
                value={inputValues[course.id] ?? ''}
                onChangeText={(text) => handleMarksChange(course.id, text)}
              />
              {errors[course.id] ? (
                <Text style={styles.errorText}>{errors[course.id]}</Text>
              ) : null}

              <View style={styles.buttonRow}>
                <CustomButton
                  title="Simulate Miss Class"
                  variant="secondary"
                  onPress={() => simulateSkipClass(course)}
                  style={styles.smallButton}
                />
                <CustomButton
                  title="Simulate Attend Class"
                  variant="secondary"
                  onPress={() => simulateAttendClass(course)}
                  style={styles.smallButton}
                />
              </View>

              <CustomButton
                title="Remove Course"
                variant="secondary"
                onPress={() => removeCourse(course.id)}
                style={styles.removeButton}
              />
            </Card>
          );
        })
      )}

      <CustomButton
        title="Back to Dashboard"
        onPress={() => setActiveTab('dashboard')}
        style={styles.navButton}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B4332',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  courseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B4332',
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: '#444',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  smallButton: {
    flex: 1,
  },
  removeButton: {
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 12,
  },
  navButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});