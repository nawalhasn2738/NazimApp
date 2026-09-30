import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "../constants/theme";
import useLayout, { MAX_CONTENT_WIDTH } from "../hooks/useLayout";
import Icon from "./Icon";

/**
 * Popover menu that drops down from the app bar's top-right corner
 * (overflow menu / notifications list). Tapping outside closes it.
 *
 * @param {{ visible: boolean, title?: string, items: Array<{ key: string, label: string, detail?: string, icon?: string, tone?: 'danger', disabled?: boolean, onPress?: () => void }>, onClose: () => void }} props
 */
export default function MenuSheet({ visible, title, items, onClose }) {
  const insets = useSafeAreaInsets();
  const { windowWidth } = useLayout();
  // Line the menu up with the content shell's right edge on wide windows.
  const right = Math.max(12, (windowWidth - MAX_CONTENT_WIDTH) / 2 + 12);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close menu" onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[styles.panel, { right, top: insets.top + 56 }]}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {items.map((item) => (
            <Pressable
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: Boolean(item.disabled) }}
              disabled={item.disabled}
              key={item.key}
              onPress={() => {
                onClose();
                item.onPress?.();
              }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {item.icon ? (
                <Icon color={item.tone === "danger" ? colors.bad : colors.inkMuted} name={item.icon} size={20} />
              ) : null}
              <View style={styles.itemText}>
                <Text style={[styles.label, item.tone === "danger" && styles.danger, item.disabled && styles.muted]}>
                  {item.label}
                </Text>
                {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
              </View>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.scrim,
    flex: 1,
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    maxWidth: 320,
    minWidth: 240,
    paddingVertical: 8,
    position: "absolute",
  },
  title: {
    color: colors.inkMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemPressed: {
    backgroundColor: colors.cardAlt,
  },
  itemText: {
    flex: 1,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  detail: {
    color: colors.inkMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 4,
  },
  danger: {
    color: colors.bad,
  },
  muted: {
    color: colors.inkMuted,
  },
});
