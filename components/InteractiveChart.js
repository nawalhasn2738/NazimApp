import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";

const BUBBLE_WIDTH = 104;

/**
 * Wraps a react-native-chart-kit chart with touch interaction: press or drag
 * across it to pick a data point. The chart itself is untouched - this adds a
 * transparent touch layer plus a highlight and a floating value bubble on top.
 *
 * @param {{ width: number, height: number, label: string, selected: null | { x: number, y: number, bubble: string, plotTop: number, plotBottom: number, barLeft?: number, barWidth?: number }, kind: "line" | "bar", indexFromX: (x: number) => number | null, selectedIndex: number | null, onSelect: (index: number | null) => void, referenceValue?: number, yMin?: number, yMax?: number, children: import('react').ReactNode }} props
 */
export default function InteractiveChart({ width, height, label, selected, kind, indexFromX, selectedIndex, onSelect, referenceValue, yMin = 0, yMax = 100, children }) {
  const pick = (event) => {
    const x = event.nativeEvent.locationX ?? event.nativeEvent.offsetX;
    if (x === undefined) return;
    const index = indexFromX(x);
    if (index !== null && index !== selectedIndex) {
      onSelect(index);
    }
  };

  let bubbleLeft = 0;
  let bubbleTop = 0;
  if (selected) {
    bubbleLeft = Math.max(0, Math.min(width - BUBBLE_WIDTH, selected.x - BUBBLE_WIDTH / 2));
    // Above the point, or below it when there is no room at the top.
    bubbleTop = selected.y - 46 < 0 ? selected.y + 16 : selected.y - 46;
  }

  const plotTop = 16;
  const plotBottom = height * 0.75 + plotTop;
  const referenceTop = referenceValue === undefined
    ? null
    : plotBottom - ((referenceValue - yMin) / (yMax - yMin)) * (plotBottom - plotTop);

  return (
    <View style={{ height, width }}>
      {children}

      {referenceTop !== null ? (
        <View pointerEvents="none" style={[styles.reference, { top: referenceTop, width: width - 64 }]}>
          <Text style={styles.referenceLabel}>{referenceValue}% required</Text>
        </View>
      ) : null}

      {selected ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {kind === "line" ? (
            <>
              <View
                style={[styles.guide, { height: selected.plotBottom - selected.plotTop, left: selected.x - 1, top: selected.plotTop }]}
              />
              <View style={[styles.dot, { left: selected.x - 9, top: selected.y - 9 }]} />
            </>
          ) : (
            <View
              style={[
                styles.column,
                {
                  height: selected.plotBottom - selected.plotTop,
                  left: selected.barLeft - 9,
                  top: selected.plotTop,
                  width: selected.barWidth + 18,
                },
              ]}
            />
          )}
          <View style={[styles.bubble, { left: bubbleLeft, top: bubbleTop }]}>
            <Text style={styles.bubbleText}>{selected.bubble}</Text>
          </View>
        </View>
      ) : null}

      <View
        accessibilityHint="Press or drag to inspect values"
        accessibilityLabel={label}
        onPointerLeave={() => onSelect(null)}
        onPointerMove={pick}
        onResponderGrant={pick}
        onResponderMove={pick}
        onResponderTerminationRequest={() => true}
        onStartShouldSetResponder={() => true}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  guide: {
    backgroundColor: colors.accent,
    opacity: 0.7,
    position: "absolute",
    width: 2,
  },
  dot: {
    backgroundColor: colors.accent,
    borderColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 18,
    position: "absolute",
    width: 18,
  },
  column: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderRadius: radii.control,
    borderWidth: 1.5,
    position: "absolute",
  },
  bubble: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.control,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    width: BUBBLE_WIDTH,
  },
  bubbleText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  reference: {
    borderTopColor: colors.inkMuted,
    borderTopStyle: "dashed",
    borderTopWidth: 1,
    left: 64,
    position: "absolute",
  },
  referenceLabel: {
    alignSelf: "flex-end",
    backgroundColor: colors.card,
    color: colors.inkMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    paddingHorizontal: 4,
    position: "absolute",
    right: 0,
    top: -18,
  },
});
