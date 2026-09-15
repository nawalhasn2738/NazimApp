import { StyleSheet, Text, View } from "react-native";

// type: 'danger' | 'warning' | 'safe'
export default function AlertBadge({ type = "safe", message }) {
  const config = {
    danger: { bg: "#FDECEA", text: "#C62828", label: "⚠ Critical" },
    warning: { bg: "#FFF4E5", text: "#E65100", label: "⚠ Warning" },
    safe: { bg: "#E8F5E9", text: "#2E7D32", label: "✓ On Track" },
  };
  const { bg, text, label } = config[type] || config.safe;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
  },
});
