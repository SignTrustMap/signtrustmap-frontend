import { StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";

// ---------------------------------------------------------------------------
// LivestreamTopBar
// Floating top bar: close button (left) + recording badge (right).
// The stop control has been moved to the center-bottom of the screen.
// ---------------------------------------------------------------------------

export type LivestreamTopBarProps = {
  isRecording: boolean;
  elapsedSeconds: number;
  onClose: () => void;
};

export function LivestreamTopBar({
  isRecording,
  elapsedSeconds,
  onClose,
}: LivestreamTopBarProps) {
  return (
    <>
      {/* Dark gradient so controls are legible over any camera feed */}
      <View style={styles.gradient} pointerEvents="none" />

      <SafeAreaView edges={["top"]} style={styles.bar}>
        {/* Close */}
        <Pressable
          accessibilityLabel="Close Livestream"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.6 : 1, marginTop: Spacing.one },
          ]}
        >
          <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
        </Pressable>

        {/* Live badge + elapsed timer */}
        {isRecording && (
          <View style={styles.recordingBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime}>{formatTime(elapsedSeconds)}</Text>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.6)",
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
  recordingTime: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
});
