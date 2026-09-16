import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, shadow } from "../constants/theme";
import OrganicIcon from "./OrganicIcon";

/**
 * Reusable app button with primary/secondary states, loading state, icon support, and touch feedback.
 *
 * @param {{ title: string, onPress: () => void, icon?: string, variant?: 'primary' | 'secondary' | 'danger', disabled?: boolean, loading?: boolean, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function CustomButton({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const iconColor = isPrimary || isDanger ? colors.surface : colors.matteForest;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={disabled || loading}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.primary,
        !isPrimary && !isDanger && styles.secondary,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <OrganicIcon color={iconColor} name={icon} size={19} strokeWidth={1.9} /> : null}
          <Text
            numberOfLines={2}
            style={[
              styles.text,
              isPrimary && styles.primaryText,
              !isPrimary && !isDanger && styles.secondaryText,
              isDanger && styles.dangerText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: colors.matteInnerLight,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    ...shadow,
  },
  contentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.matteForest,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.matteInnerDark,
  },
  danger: {
    backgroundColor: colors.criticalText,
    borderColor: colors.criticalBorder,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.45,
    textAlign: "center",
    textTransform: "uppercase",
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.matteForest,
  },
  dangerText: {
    color: colors.surface,
  },
});
