import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "../constants/theme";
import useLayout, { MAX_CONTENT_WIDTH } from "../hooks/useLayout";
import Icon from "./Icon";

export default function MenuSheet({ visible, items, newCount = 0, onClose }) {
  const insets = useSafeAreaInsets();
  const { windowWidth } = useLayout();
  const progress = useRef(new Animated.Value(0)).current;
  const right = Math.max(12, (windowWidth - MAX_CONTENT_WIDTH) / 2 + 12);
  const width = Math.min(320, windowWidth - 24);

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    Animated.timing(progress, { duration: 150, toValue: 1, useNativeDriver: true }).start();
  }, [progress, visible]);

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close alerts" onPress={onClose} style={styles.outsideLayer}>
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: progress,
              right,
              top: insets.top + 52,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
              width,
            },
          ]}
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View style={styles.caret} />
            <View style={styles.header}>
              <Text style={styles.title}>Alerts</Text>
              <Text style={styles.newCount}>{newCount} new</Text>
            </View>

            {items.length > 0 ? items.map((item) => (
              <Pressable
                accessibilityLabel={`${item.label}. ${item.detail}`}
                accessibilityRole="button"
                key={item.key}
                onPress={() => {
                  onClose();
                  item.onPress?.();
                }}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={[styles.statusLine, { backgroundColor: item.isRisk ? colors.bad : "#9CA3AF" }]} />
                <View style={styles.itemText}>
                  <Text numberOfLines={1} style={styles.label}>{item.label}</Text>
                  <Text style={styles.detail}>{item.detail}</Text>
                </View>
                <Icon color="#6B7280" name="chevron" size={18} />
              </Pressable>
            )) : (
              <View style={styles.emptyState}>
                <Icon color={colors.header} name="statusSafe" size={20} />
                <Text style={styles.emptyText}>All courses are above 75%</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outsideLayer: { backgroundColor: "transparent", flex: 1 },
  panel: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRadius: 8, borderWidth: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxWidth: 320, position: "absolute" },
  caret: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", borderRightWidth: 0, borderTopLeftRadius: 2, borderTopWidth: 1, borderLeftWidth: 1, height: 12, position: "absolute", right: 18, top: -7, transform: [{ rotate: "45deg" }], width: 12 },
  header: { alignItems: "center", borderBottomColor: "#E5E7EB", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 44, paddingHorizontal: 12 },
  title: { color: "#1F2937", fontFamily: fonts.bodySemi, fontSize: 14 },
  newCount: { color: "#6B7280", fontFamily: fonts.body, fontSize: 12 },
  item: { alignItems: "stretch", backgroundColor: "#FFFFFF", flexDirection: "row", minHeight: 64 },
  itemPressed: { backgroundColor: "#F5F5F5" },
  statusLine: { width: 3 },
  itemText: { flex: 1, justifyContent: "center", padding: 12 },
  label: { color: "#1F2937", fontFamily: fonts.bodySemi, fontSize: 14 },
  detail: { color: "#6B7280", fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 64, padding: 12 },
  emptyText: { color: "#1F2937", fontFamily: fonts.bodyMedium, fontSize: 14 },
});
