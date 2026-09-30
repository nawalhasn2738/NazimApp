import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

/**
 * Slides + fades a screen in when it mounts. Give it a `key` per screen so a
 * view switch remounts it. `direction` 1 slides in from the right (going
 * deeper), -1 from the left (going back).
 *
 * @param {{ children: import('react').ReactNode, direction?: 1 | -1 }} props
 */
export default function ScreenTransition({ children, direction = 1 }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [direction * 32, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
