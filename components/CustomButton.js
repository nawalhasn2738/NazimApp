import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import Icon from "./Icon";

const VARIANTS = {
  primary: { backgroundColor: colors.brand, borderColor: colors.brand, textColor: colors.onBrand },
  secondary: { backgroundColor: colors.card, borderColor: colors.line, textColor: colors.ink },
  danger: { backgroundColor: colors.badSoft, borderColor: colors.bad, textColor: colors.bad },
};

/**
 * App button with primary / secondary / danger variants, optional icon,
 * loading and disabled states, and pressed feedback.
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
  const look = VARIANTS[variant] ?? VARIANTS.primary;
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked }}
      disabled={isBlocked}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.backgroundColor, borderColor: look.borderColor },
        isBlocked && styles.disabled,
        pressed && !isBlocked && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon color={look.textColor} name={icon} size={18} /> : null}
          <Text numberOfLines={2} style={[styles.text, { color: look.textColor }]}>
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
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
});
