import { StyleSheet, View } from "react-native";
import { colors, radii, shadow } from "../constants/theme";

/**
 * Shared white surface used for dashboard sections, simulator course rows, and empty states.
 *
 * @param {{ children: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginHorizontal: 16,
    marginVertical: 11,
    padding: 20,
    ...shadow,
  },
});
