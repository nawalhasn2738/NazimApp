import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";

/**
 * "P" / "A" badge for one attendance record. A dashed outline marks a
 * simulated (what-if) class so it is never confused with real history.
 *
 * @param {{ status: "P" | "A", isSimulated?: boolean, variant?: "compact" | "wide" }} props
 */
export default function PresencePill({ status, isSimulated = false, variant = "compact" }) {
  const isPresent = status === "P";
  const tone = isPresent ? colors.good : colors.bad;

  return (
    <View
      style={[
        styles.base,
        variant === "wide" ? styles.wide : styles.compact,
        { backgroundColor: isPresent ? colors.goodSoft : colors.badSoft },
        isSimulated && { borderColor: tone, borderStyle: "dashed", borderWidth: 1.5 },
      ]}
    >
      <Text style={[styles.text, { color: tone }]}>{variant === "wide" ? (isPresent ? "Present" : "Absent") : status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
  },
  compact: {
    height: 28,
    width: 28,
  },
  wide: {
    minHeight: 28,
    minWidth: 68,
    paddingHorizontal: 8,
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});
