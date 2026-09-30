import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import { clampScore } from "../utils/attendance";
import CustomButton from "./CustomButton";

/**
 * Expected-score input with -5 / +5 steppers and inline validation.
 * It owns only the text being typed; the accepted number goes up via
 * `onChange`. Remount it (change its `key`) to force it to re-read `value`.
 *
 * @param {{ value: number, onChange: (score: number) => void }} props
 */
export default function ScoreControl({ value, onChange }) {
  const [text, setText] = useState(String(value));
  const [feedback, setFeedback] = useState(null);

  const handleChangeText = (rawValue) => {
    setText(rawValue);
    const trimmed = rawValue.trim();

    if (trimmed === "") {
      setFeedback({ message: "Enter a score from 0 to 100.", isBlocking: true });
      return;
    }

    if (!/^\d{1,3}$/.test(trimmed)) {
      setFeedback({ message: "Use whole numbers only.", isBlocking: true });
      return;
    }

    const numeric = Number(trimmed);
    const clamped = clampScore(numeric);

    if (numeric !== clamped) {
      // Valid number, out of range: accept the clamped value but say so.
      setText(String(clamped));
      setFeedback({ message: `Adjusted to ${clamped} - scores must be between 0 and 100.`, isBlocking: false });
    } else {
      setFeedback(null);
    }

    onChange(clamped);
  };

  const step = (amount) => {
    const next = clampScore(value + amount);
    setText(String(next));
    setFeedback(null);
    onChange(next);
  };

  return (
    <View>
      <View style={styles.row}>
        <CustomButton title="-5" variant="secondary" onPress={() => step(-5)} style={styles.stepButton} />
        <TextInput
          accessibilityLabel="Expected score"
          keyboardType="number-pad"
          maxLength={3}
          onChangeText={handleChangeText}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder="0-100"
          placeholderTextColor={colors.inkMuted}
          returnKeyType="done"
          selectionColor={colors.brand}
          style={[styles.input, feedback?.isBlocking && styles.inputError]}
          value={text}
        />
        <CustomButton title="+5" variant="secondary" onPress={() => step(5)} style={styles.stepButton} />
      </View>
      {feedback ? (
        <Text style={[styles.feedback, !feedback.isBlocking && styles.notice]}>{feedback.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  stepButton: {
    minWidth: 64,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.line,
    borderRadius: radii.control,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.headingExtra,
    fontSize: 20,
    minHeight: 52,
    textAlign: "center",
  },
  inputError: {
    borderColor: colors.bad,
  },
  feedback: {
    color: colors.bad,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  notice: {
    color: colors.warn,
  },
});
