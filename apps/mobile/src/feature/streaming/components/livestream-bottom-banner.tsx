import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";

// ---------------------------------------------------------------------------
// LivestreamBottomBanner
// Permanent, non-interactive overlay that communicates the feature purpose.
// ---------------------------------------------------------------------------

export function LivestreamBottomBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, Spacing.three) },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={18}
          color="#ffffff"
          style={styles.icon}
        />
        <Text style={styles.text}>
          Livestream allows real time sign detection
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
  },
  icon: {
    opacity: 0.9,
  },
  text: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "sans-serif",
    opacity: 0.92,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
