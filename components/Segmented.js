import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import Icon from "./Icon";

/**
 * Equal-width segmented control used to swap panels inside a card
 * (an in-content control, not app navigation).
 *
 * @param {{ options: Array<{ label: string, value: string, icon?: string }>, value: string, onChange: (value: string) => void }} props
 */
export default function Segmented({ options, value, onChange }) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            {option.icon ? <Icon color={isActive ? colors.onBrand : colors.inkMuted} name={option.icon} size={16} /> : null}
            <Text style={[styles.text, isActive && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.cardAlt,
    borderRadius: radii.pill,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: radii.pill,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: colors.brand,
  },
  text: {
    color: colors.inkMuted,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  textActive: {
    color: colors.onBrand,
    fontFamily: fonts.bodyBold,
  },
});
