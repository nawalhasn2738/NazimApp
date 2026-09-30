import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import CustomButton from "./CustomButton";

/**
 * Centered confirmation dialog for destructive actions.
 *
 * @param {{ visible: boolean, title: string, message: string, confirmLabel: string, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmModal({ visible, title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <CustomButton title="Cancel" variant="secondary" onPress={onCancel} style={styles.button} />
            <CustomButton title={confirmLabel} variant="danger" onPress={onConfirm} style={styles.button} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    maxWidth: 380,
    padding: 24,
    width: "100%",
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 20,
    marginBottom: 8,
  },
  message: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
  },
});
