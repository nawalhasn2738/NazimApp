import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { colors } from "../constants/theme";

/**
 * Circular progress gauge drawn with react-native-svg. An optional tick marks
 * a threshold (e.g. the 75% attendance requirement). Children render in the
 * center.
 *
 * @param {{ value: number, size?: number, strokeWidth?: number, color?: string, trackColor?: string, threshold?: number, children?: import('react').ReactNode }} props
 */
export default function ProgressRing({
  value,
  size = 140,
  strokeWidth = 12,
  color = colors.inkMuted,
  trackColor = colors.cardAlt,
  threshold,
  children,
}) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  let tick = null;
  if (typeof threshold === "number") {
    const angle = (threshold / 100) * 2 * Math.PI - Math.PI / 2;
    const inner = radius - strokeWidth / 2 - 3;
    const outer = radius + strokeWidth / 2 + 3;
    tick = (
      <Line
        stroke={colors.ink}
        strokeLinecap="round"
        strokeWidth={2.5}
        x1={center + inner * Math.cos(angle)}
        x2={center + outer * Math.cos(angle)}
        y1={center + inner * Math.sin(angle)}
        y2={center + outer * Math.sin(angle)}
      />
    );
  }

  return (
    <View style={{ height: size, width: size }}>
      <Svg height={size} style={StyleSheet.absoluteFill} width={size}>
        <Circle cx={center} cy={center} fill="none" r={radius} stroke={trackColor} strokeWidth={strokeWidth} />
        <Circle
          cx={center}
          cy={center}
          fill="none"
          origin={`${center}, ${center}`}
          r={radius}
          rotation={-90}
          stroke={color}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
        {tick}
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
