import { useEffect, useMemo, useState } from "react";
import { Animated, StyleSheet, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// LivestreamRecordControl
// Centre-bottom camera control that morphs between two states:
//   Recording  → white ring + red stop-square  (tap to stop)
//   Idle       → white ring + red circle       (normal record-button look)
//
// On stop the shape springs back to a circle so the user sees clear visual
// feedback before the screen navigates away.
// ---------------------------------------------------------------------------

const BANNER_HEIGHT = 64; // keeps the button above the bottom banner

export type LivestreamRecordControlProps = {
  isRecording: boolean;
  onStopRecording: () => void;
};

export function LivestreamRecordControl({
  isRecording,
  onStopRecording,
}: LivestreamRecordControlProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 16) + BANNER_HEIGHT;

  // Animated value: 1 = recording (stop-square), 0 = idle (circle).
  // useState with a lazy initialiser gives a stable instance the lint rule accepts.
  const [morphAnim] = useState(() => new Animated.Value(isRecording ? 1 : 0));

  useEffect(() => {
    Animated.spring(morphAnim, {
      toValue: isRecording ? 1 : 0,
      damping: 14,
      mass: 0.6,
      stiffness: 180,
      useNativeDriver: false, // borderRadius requires layout animation
    }).start();
  }, [isRecording, morphAnim]);

  // Interpolated values are stable because morphAnim never changes identity.
  const innerBorderRadius = useMemo(
    () =>
      morphAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [26, 6], // 26 = full circle (half of 52 inner), 6 = square corner
      }),
    [morphAnim],
  );

  const innerScale = useMemo(
    () =>
      morphAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.78, 1],
      }),
    [morphAnim],
  );

  const ringScale = useMemo(
    () =>
      morphAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.92],
      }),
    [morphAnim],
  );

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityLabel={isRecording ? "Stop recording" : "Record button"}
        accessibilityRole="button"
        onPress={isRecording ? onStopRecording : undefined}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        {/* Outer ring */}
        <Animated.View
          style={[styles.ring, { transform: [{ scale: ringScale }] }]}
        >
          {/* Inner shape: springs between circle (idle) and stop-square (recording) */}
          <Animated.View
            style={[
              styles.innerShape,
              {
                borderRadius: innerBorderRadius,
                transform: [{ scale: innerScale }],
              },
            ]}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  innerShape: {
    width: 52,
    height: 52,
    backgroundColor: "#ff3b30",
    // borderRadius is driven by morphAnim → innerBorderRadius
  },
});
