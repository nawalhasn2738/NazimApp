import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";

const STATUS = {
  danger: {
    backgroundColor: colors.criticalBg,
    label: "Critical",
    textColor: colors.criticalText,
  },
  warning: {
    backgroundColor: colors.warningBg,
    label: "Warning",
    textColor: colors.warningText,
  },
  safe: {
    backgroundColor: colors.primarySoft,
    label: "On Track",
    textColor: colors.primaryDark,
  },
};

/**
 * Reusable attendance/status badge for safe, warning, and critical course states.
 *
 * @param {{ type?: 'safe' | 'warning' | 'danger', message: string, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function AlertBadge({ type = "safe", message, style }) {
  const status = STATUS[type] ?? STATUS.safe;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.badge,
        { backgroundColor: status.backgroundColor },
        style,
      ]}
    >
      <Text style={[styles.label, { color: status.textColor }]}>{status.label}</Text>
      <Text style={[styles.message, { color: status.textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 24,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
});
