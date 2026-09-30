import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import { validateNewCourse } from "../utils/courseForm";

const EMPTY_VALUES = { code: "", name: "", classesAttended: "", classesHeld: "" };
const FIELDS = [
  { key: "code", label: "Course code", placeholder: "CS-410", autoCapitalize: "characters", keyboardType: "default" },
  { key: "name", label: "Course name", placeholder: "Operating Systems", autoCapitalize: "sentences", keyboardType: "default" },
  { key: "classesAttended", label: "Classes attended", placeholder: "0", autoCapitalize: "none", keyboardType: "number-pad" },
  { key: "classesHeld", label: "Total classes held", placeholder: "0", autoCapitalize: "none", keyboardType: "number-pad" },
];

export default function AddCourseModal({ visible, courses, onSubmit, onClose }) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const validation = validateNewCourse(values, courses);
  const isValid = Boolean(validation.course);

  const close = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    onClose();
  };

  const updateField = (key, text) => {
    setValues((current) => ({ ...current, [key]: text }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateField = (key) => {
    const result = validateNewCourse(values, courses);
    setErrors((current) => ({ ...current, [key]: result.errors[key] }));
  };

  const save = () => {
    const result = validateNewCourse(values, courses);
    if (!result.course) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.course);
    close();
  };

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add course</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {FIELDS.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  accessibilityLabel={field.label}
                  autoCapitalize={field.autoCapitalize}
                  keyboardType={field.keyboardType}
                  onBlur={() => validateField(field.key)}
                  onChangeText={(text) => updateField(field.key, text)}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#059669"
                  style={[styles.input, errors[field.key] && styles.inputError]}
                  value={values[field.key]}
                />
                {errors[field.key] ? <Text style={styles.error}>{errors[field.key]}</Text> : null}
              </View>
            ))}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={close} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={!isValid} onPress={save} style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}>
                <Text style={[styles.saveText, !isValid && styles.saveTextDisabled]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(31,41,55,0.35)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: "90%", padding: 16, width: "100%" },
  title: { color: "#1F2937", fontFamily: fonts.bodySemi, fontSize: 20, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { color: "#1F2937", fontFamily: fonts.bodySemi, fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: radii.control, borderWidth: 1, color: "#1F2937", fontFamily: fonts.body, fontSize: 16, minHeight: 44, paddingHorizontal: 12 },
  inputError: { borderColor: "#D64560" },
  error: { color: "#D64560", fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: "row", gap: 12, justifyContent: "flex-end", paddingTop: 8 },
  cancelButton: { alignItems: "center", height: 44, justifyContent: "center", paddingHorizontal: 12 },
  cancelText: { color: "#059669", fontFamily: fonts.bodySemi, fontSize: 14 },
  saveButton: { alignItems: "center", backgroundColor: "#059669", borderRadius: radii.control, height: 44, justifyContent: "center", minWidth: 96, paddingHorizontal: 16 },
  saveButtonDisabled: { backgroundColor: "#E5E7EB" },
  saveText: { color: "#FFFFFF", fontFamily: fonts.bodySemi, fontSize: 14 },
  saveTextDisabled: { color: "#9CA3AF" },
});
