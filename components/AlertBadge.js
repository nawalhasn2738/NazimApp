import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import Icon from "./Icon";

const STATUS = {
  danger: { backgroundColor: colors.badSoft, color: colors.bad, label: "Below requirement", icon: "statusDanger" },
  warning: { backgroundColor: colors.warnSoft, color: colors.warn, label: "Close to the limit", icon: "statusWarn" },
  safe: { backgroundColor: colors.goodSoft, color: colors.good, label: "On track", icon: "statusSafe" },
};

/**
 * Status banner for a course's attendance. The label + mark are always shown,
 * so meaning never depends on color alone.
 *
 * @param {{ type?: 'safe' | 'warning' | 'danger', message: string, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function AlertBadge({ type = "safe", message, style }) {
  const status = STATUS[type] ?? STATUS.safe;
  // "alert" is only for states that need attention; "safe" is plain text.
  const accessibilityRole = type === "danger" || type === "warning" ? "alert" : "text";

  return (
    <View
      accessibilityRole={accessibilityRole}
      style={[styles.badge, { backgroundColor: status.backgroundColor }, style]}
    >
      <Icon color={status.color} name={status.icon} size={24} />
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: status.color }]}>{status.label}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "flex-start",
    borderRadius: radii.control,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  message: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
