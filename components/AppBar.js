import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import Icon from "./Icon";

/**
 * Fixed top app bar: a leading slot (back button or app mark), a large title,
 * and up to two round trailing icon actions. It sits above the scrolling
 * content, so it is a header - not a side or bottom navigation bar.
 *
 * @param {{ title: string, subtitle?: string, onBack?: () => void, actions?: Array<{ icon: string, label: string, onPress: () => void, badge?: number }> }} props
 */
export default function AppBar({ title, subtitle, onBack, actions = [] }) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={styles.roundButton}>
          <Icon color={colors.onBrand} name="back" size={22} />
        </Pressable>
      ) : (
        <View style={styles.mark}>
          <Text style={styles.markText}>N</Text>
        </View>
      )}

      <View style={styles.titleBlock}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actions.map((action) => (
        <Pressable
          accessibilityLabel={action.label}
          accessibilityRole="button"
          key={action.label}
          onPress={action.onPress}
          style={styles.roundButton}
        >
          <Icon color={colors.onBrand} name={action.icon} size={22} />
          {action.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{action.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    backgroundColor: colors.header,
    flexDirection: "row",
    gap: 8,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radii.pill,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  mark: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radii.pill,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  markText: {
    color: colors.onBrand,
    fontFamily: fonts.headingExtra,
    fontSize: 20,
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 4,
  },
  title: {
    color: colors.onBrand,
    fontFamily: fonts.headingExtra,
    fontSize: 20,
  },
  subtitle: {
    color: colors.onBrand,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.bad,
    borderColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 4,
    position: "absolute",
    right: -2,
    top: -2,
  },
  badgeText: {
    color: colors.onBrand,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});
