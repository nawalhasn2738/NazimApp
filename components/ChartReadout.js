import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import Icon from "./Icon";

/**
 * Detail panel shown under a chart for the currently selected point.
 * With nothing selected it shows a hint, so the interaction is discoverable.
 *
 * @param {{ hint: string, title?: string, value?: string, tone?: 'good' | 'bad', stats?: Array<{ label: string, value: string, tone?: 'good' | 'bad' }>, action?: { label: string, onPress: () => void }, onClear?: () => void }} props
 */
export default function ChartReadout({ hint, title, value, tone = "good", stats = [], action, onClear }) {
  if (!title) {
    return (
      <View style={styles.hintRow}>
        <Icon color={colors.inkMuted} name="touch" size={18} />
        <Text style={styles.hint}>{hint}</Text>
      </View>
    );
  }

  const accent = tone === "bad" ? colors.bad : colors.good;

  return (
    <View style={styles.panel}>
      <View style={styles.top}>
        <View style={styles.topText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color: accent }]}>{value}</Text>
        </View>
        <Pressable accessibilityLabel="Clear selection" accessibilityRole="button" onPress={onClear} style={styles.clear}>
          <Icon color={colors.inkMuted} name="close" size={18} />
        </Pressable>
      </View>
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, stat.tone && { color: stat.tone === "bad" ? colors.bad : colors.good }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.action}>
          <Text style={styles.actionText}>{action.label}</Text>
          <Icon color={colors.accent} name="chevron" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hintRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 12 },
  hint: { color: colors.inkMuted, flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12 },
  panel: { backgroundColor: colors.cardAlt, borderRadius: radii.control, marginTop: 16, padding: 16 },
  top: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  topText: { flex: 1 },
  title: { color: colors.inkMuted, fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" },
  value: { fontFamily: fonts.headingExtra, fontSize: 28, lineHeight: 32, marginTop: 4 },
  clear: { alignItems: "center", height: 44, justifyContent: "center", marginRight: -10, marginTop: -10, width: 44 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  stat: { backgroundColor: colors.card, borderRadius: radii.control, flexGrow: 1, minWidth: 96, paddingHorizontal: 12, paddingVertical: 8 },
  statLabel: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  statValue: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 4 },
  action: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, minHeight: 44, marginTop: 8 },
  actionText: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 14 },
});
