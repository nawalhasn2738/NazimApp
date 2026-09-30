import { StyleSheet, View } from "react-native";
import { colors, radii } from "../constants/theme";

/**
 * Base flat surface used for every panel.
 *
 * @param {{ children: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
  },
});
