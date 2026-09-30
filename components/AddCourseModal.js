import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import { validateNewCourse } from "../utils/courseForm";
import CustomButton from "./CustomButton";

const EMPTY_VALUES = {
  code: "",
  name: "",
  creditHours: "3",
  currentGrade: "",
  expectedScore: "",
  classesHeld: "",
  classesAttended: "",
};

// One entry per input, so the form is generated from data rather than repeated.
const FIELDS = [
  { key: "code", label: "Course code", placeholder: "CS-350", keyboardType: "default" },
  { key: "name", label: "Course name", placeholder: "Operating Systems", keyboardType: "default" },
  { key: "creditHours", label: "Credit hours (1-6)", placeholder: "3", keyboardType: "number-pad" },
  { key: "currentGrade", label: "Current grade (%)", placeholder: "0-100", keyboardType: "number-pad" },
  { key: "expectedScore", label: "Expected score (%)", placeholder: "0-100", keyboardType: "number-pad" },
  { key: "classesHeld", label: "Classes held so far", placeholder: "10", keyboardType: "number-pad" },
  { key: "classesAttended", label: "Classes attended", placeholder: "8", keyboardType: "number-pad" },
];

/**
 * Form for adding a course. All validation lives in utils/courseForm.js;
 * this component only collects the text and shows the returned errors.
 *
 * @param {{ visible: boolean, courses: Array<{ code: string }>, onSubmit: (course: object) => void, onClose: () => void }} props
 */
export default function AddCourseModal({ visible, courses, onSubmit, onClose }) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});

  const close = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const result = validateNewCourse(values, courses);

    if (!result.course) {
      setErrors(result.errors);
      return;
    }

    onSubmit(result.course);
    close();
  };

  const updateField = (key, text) => {
    setValues((current) => ({ ...current, [key]: text }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add a course</Text>
            <Pressable accessibilityLabel="Close form" accessibilityRole="button" onPress={close} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {FIELDS.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  accessibilityLabel={field.label}
                  autoCapitalize={field.keyboardType === "default" ? "words" : "none"}
                  keyboardType={field.keyboardType}
                  onChangeText={(text) => updateField(field.key, text)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.inkMuted}
                  selectionColor={colors.brand}
                  style={[styles.input, errors[field.key] && styles.inputError]}
                  value={values[field.key]}
                />
                {errors[field.key] ? <Text style={styles.error}>{errors[field.key]}</Text> : null}
              </View>
            ))}
            <CustomButton icon="plus" title="Add course" onPress={handleSubmit} style={styles.submit} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  // Full width on phones; a centered 560px sheet on wide windows.
  sheet: {
    maxWidth: 560,
    width: "100%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "90%",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.headingExtra,
    fontSize: 20,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  closeText: {
    color: colors.brand,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: colors.bad,
  },
  error: {
    color: colors.bad,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginTop: 8,
  },
  submit: {
    marginBottom: 32,
    marginTop: 8,
  },
});
