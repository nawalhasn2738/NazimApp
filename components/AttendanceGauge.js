import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

const SIZE = 200;
const CENTER = 100;
const RADIUS = 80;
const STROKE = 12;
const START_ANGLE = 135;
const SWEEP_ANGLE = 270;
const ARC_LENGTH = 2 * Math.PI * RADIUS * (SWEEP_ANGLE / 360);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const pointAt = (angle, radius = RADIUS) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
};

const start = pointAt(START_ANGLE);
const end = pointAt(START_ANGLE + SWEEP_ANGLE);
const arcPath = `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`;

export default function AttendanceGauge({ value }) {
  const target = Math.max(0, Math.min(100, value));
  const [displayedValue, setDisplayedValue] = useState(target);
  const [reduceMotion, setReduceMotion] = useState(false);
  const animatedValue = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: nextValue }) => setDisplayedValue(nextValue));
    return () => animatedValue.removeListener(listener);
  }, [animatedValue]);

  useEffect(() => {
    if (reduceMotion) {
      animatedValue.stopAnimation();
      animatedValue.setValue(target);
      return;
    }
    Animated.timing(animatedValue, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
      toValue: target,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, reduceMotion, target]);

  const statusColor = target >= 75 ? "#10B981" : "#D64560";
  const progressLength = ARC_LENGTH * (displayedValue / 100);
  const thumb = pointAt(START_ANGLE + SWEEP_ANGLE * (displayedValue / 100));
  const requirementAngle = START_ANGLE + SWEEP_ANGLE * 0.75;
  const gapStart = pointAt(requirementAngle, RADIUS - STROKE / 2 - 2);
  const gapEnd = pointAt(requirementAngle, RADIUS + STROKE / 2 + 2);
  const label0 = pointAt(START_ANGLE, 101);
  const label75 = pointAt(requirementAngle, 95);
  const label100 = pointAt(START_ANGLE + SWEEP_ANGLE, 101);

  return (
    <View accessibilityLabel={`${Math.round(target)}% attendance`} style={styles.wrap}>
      <Svg height={SIZE} viewBox="0 0 200 200" width={SIZE}>
        <Path d={arcPath} fill="none" stroke="#E5E7EB" strokeLinecap="round" strokeWidth={STROKE} />
        <AnimatedPath
          d={arcPath}
          fill="none"
          stroke={statusColor}
          strokeDasharray={`${progressLength} ${ARC_LENGTH}`}
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
        <Line stroke="#FFFFFF" strokeWidth={2} x1={gapStart.x} x2={gapEnd.x} y1={gapStart.y} y2={gapEnd.y} />
        <Circle cx={thumb.x} cy={thumb.y} fill="#FFFFFF" r={9} stroke={statusColor} strokeWidth={4} />

        <SvgText fill="#6B7280" fontSize={12} textAnchor="middle" x={label0.x} y={label0.y + 4}>0%</SvgText>
        <SvgText fill="#6B7280" fontSize={12} fontWeight="600" textAnchor="middle" x={label75.x} y={label75.y + 4}>75%</SvgText>
        <SvgText fill="#6B7280" fontSize={12} textAnchor="middle" x={label100.x} y={label100.y + 4}>100%</SvgText>

        <SvgText fill="#1F2937" fontSize={40} fontWeight="400" textAnchor="middle" x={CENTER} y={99}>{`${Math.round(displayedValue)}%`}</SvgText>
        <SvgText fill="#6B7280" fontSize={12} textAnchor="middle" x={CENTER} y={120}>Attendance</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", height: SIZE, justifyContent: "center", width: SIZE },
});
