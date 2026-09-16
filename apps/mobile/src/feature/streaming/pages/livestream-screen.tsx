import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Spacing } from "@/constants/theme";
import { LivestreamTopBar } from "../components/livestream-top-bar";
import { LivestreamBottomBanner } from "../components/livestream-bottom-banner";
import { LivestreamRecordControl } from "../components/livestream-record-control";

// ---------------------------------------------------------------------------
// LivestreamScreen
// Full-screen camera view that starts recording immediately once the camera
// hardware is ready.
//
// Layout (bottom → top, all absolute):
//   LivestreamBottomBanner   — permanent info strip at the very bottom
//   LivestreamRecordControl  — large centered stop button above the banner
//   LivestreamTopBar         — close button + live timer at the top
// ---------------------------------------------------------------------------

export function LivestreamScreen() {
  const router = useRouter();

  const [cameraPermission] = useCameraPermissions();
  const [micPermission] = useMicrophonePermissions();

  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref mirror avoids stale-closure bugs in handlers without adding isRecording
  // to dependency arrays.
  const isRecordingRef = useRef(false);

  /**
   * Called directly via `onCameraReady` — avoids the
   * `react-hooks/set-state-in-effect` lint rule.
   */
  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecordingRef.current) return;

    isRecordingRef.current = true;
    setIsRecording(true);
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      // Resolves when stopRecording() is called or maxDuration is reached.
      await cameraRef.current.recordAsync({ maxDuration: 3600 });
    } catch {
      // Safe to ignore: camera unmounted or recording stopped externally.
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  // Cleanup the elapsed-time ticker on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Close without saving — stop recording then go back. */
  const handleClose = useCallback(() => {
    if (cameraRef.current && isRecordingRef.current) {
      cameraRef.current.stopRecording();
    }
    router.back();
  }, [router]);

  /**
   * User tapped the stop button.
   * 1. Stop the active recording.
   * 2. The `recordAsync` finally-block sets `isRecording → false`, which
   *    triggers the spring animation in LivestreamRecordControl (square → circle).
   * 3. After 200 ms the screen fades/slides to home — enough time for the
   *    morph animation to feel intentional rather than abrupt.
   */
  const handleStopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
    setTimeout(() => {
      router.replace("/(authenticated)/(tabs)/home");
    }, 200);
  }, [router]);

  const hasPermissions = Boolean(
    cameraPermission?.granted && micPermission?.granted,
  );

  return (
    <View style={styles.container}>
      {/* Camera feed */}
      {hasPermissions ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="video"
          onCameraReady={startRecording}
        />
      ) : (
        <View style={styles.noPermissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={56} color="#ffffff80" />
          <Text style={styles.noPermissionText}>Camera permission required</Text>
        </View>
      )}

      {/* Overlaid UI — rendered from bottom to top so z-order is correct */}
      <LivestreamBottomBanner />
      <LivestreamRecordControl
        isRecording={isRecording}
        onStopRecording={handleStopRecording}
      />
      <LivestreamTopBar
        isRecording={isRecording}
        elapsedSeconds={elapsedSeconds}
        onClose={handleClose}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  noPermissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  noPermissionText: {
    color: "#ffffff80",
    fontFamily: "sans-serif",
    fontSize: 16,
  },
});
