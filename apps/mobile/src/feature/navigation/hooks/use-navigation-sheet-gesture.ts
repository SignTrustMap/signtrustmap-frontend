import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, PanResponder, Platform } from "react-native";

export interface UseNavigationSheetGestureProps {
  hasPlannedRouteOrigin: boolean;
  isNavigating: boolean;
  destinationId?: string;
  windowHeight: number;
  bottomInset: number;
}

export function useNavigationSheetGesture({
  hasPlannedRouteOrigin,
  isNavigating,
  destinationId,
  windowHeight,
  bottomInset,
}: UseNavigationSheetGestureProps) {
  const [sheetSnapIndex, setSheetSnapIndex] = useState<0 | 1 | 2>(1);
  const snapIndexRef = useRef<0 | 1 | 2>(1);

  const peekSheetHeight = hasPlannedRouteOrigin
    ? isNavigating
      ? 180 + bottomInset
      : 188 + bottomInset
    : 110 + bottomInset;
  const midSheetHeight = hasPlannedRouteOrigin
    ? Math.min(420, windowHeight * 0.52)
    : 188 + bottomInset;
  const maxSheetHeight = Math.max(
    midSheetHeight,
    Math.min(640, windowHeight * 0.82),
  );

  const sheetHeightAnim = useRef(new Animated.Value(midSheetHeight)).current;
  const currentHeightRef = useRef(midSheetHeight);

  const snapTo = useCallback(
    (index: 0 | 1 | 2) => {
      snapIndexRef.current = index;
      setSheetSnapIndex(index);
      const targetHeight =
        index === 0
          ? peekSheetHeight
          : index === 1
            ? midSheetHeight
            : maxSheetHeight;
      currentHeightRef.current = targetHeight;
      Animated.spring(sheetHeightAnim, {
        toValue: targetHeight,
        damping: 24,
        mass: 0.8,
        stiffness: 240,
        useNativeDriver: false,
      }).start();
    },
    [peekSheetHeight, midSheetHeight, maxSheetHeight, sheetHeightAnim],
  );

  const cycleSnap = useCallback(() => {
    const current = snapIndexRef.current;
    const nextIndex = ((current + 1) % 3) as 0 | 1 | 2;
    snapTo(nextIndex);
  }, [snapTo]);

  // Keep animated height in sync if window size or bottom inset changes
  useEffect(() => {
    const targetHeight =
      snapIndexRef.current === 0
        ? peekSheetHeight
        : snapIndexRef.current === 1
          ? midSheetHeight
          : maxSheetHeight;
    currentHeightRef.current = targetHeight;
    Animated.spring(sheetHeightAnim, {
      toValue: targetHeight,
      damping: 24,
      mass: 0.8,
      stiffness: 240,
      useNativeDriver: false,
    }).start();
  }, [peekSheetHeight, midSheetHeight, maxSheetHeight, sheetHeightAnim]);

  // Snap to mid (1) when destination changes
  const hasSnappedDestinationRef = useRef(false);
  useEffect(() => {
    hasSnappedDestinationRef.current = false;
  }, [destinationId]);

  useEffect(() => {
    if (destinationId && !hasSnappedDestinationRef.current && !isNavigating) {
      hasSnappedDestinationRef.current = true;
      snapTo(1);
    }
  }, [destinationId, isNavigating, snapTo]);

  const expandableContentOpacity = sheetHeightAnim.interpolate({
    inputRange: [peekSheetHeight, peekSheetHeight + 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 3 || Math.abs(gesture.dx) > 3,
        onPanResponderGrant: () => {
          sheetHeightAnim.stopAnimation((value) => {
            currentHeightRef.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const newHeight = currentHeightRef.current - gesture.dy;
          const clamped = Math.max(
            peekSheetHeight - 10,
            Math.min(maxSheetHeight + 15, newHeight),
          );
          sheetHeightAnim.setValue(clamped);
        },
        onPanResponderRelease: (_, gesture) => {
          // Tap handling: cycle snapIndex
          if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
            cycleSnap();
            return;
          }

          // Velocity flick gestures
          const vy = gesture.vy;
          if (vy < -0.45) {
            if (snapIndexRef.current === 0) {
              snapTo(1);
            } else {
              snapTo(2);
            }
            return;
          } else if (vy > 0.45) {
            if (snapIndexRef.current === 2) {
              snapTo(1);
            } else {
              snapTo(0);
            }
            return;
          }

          // Distance-based snapping to nearest tier
          const finalHeight = currentHeightRef.current - gesture.dy;
          const thresholdPeekToMid = (peekSheetHeight + midSheetHeight) / 2;
          const thresholdMidToMax = (midSheetHeight + maxSheetHeight) / 2;

          if (finalHeight < thresholdPeekToMid) {
            snapTo(0);
          } else if (finalHeight < thresholdMidToMax) {
            snapTo(1);
          } else {
            snapTo(2);
          }
        },
        onPanResponderTerminate: () => {
          snapTo(snapIndexRef.current);
        },
      }),
    [
      peekSheetHeight,
      midSheetHeight,
      maxSheetHeight,
      sheetHeightAnim,
      snapTo,
      cycleSnap,
    ],
  );

  useEffect(() => {
    if (Platform.OS !== "android" || !destinationId || sheetSnapIndex < 2) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      snapTo(1);
      return true;
    });
    return () => subscription.remove();
  }, [destinationId, sheetSnapIndex, snapTo]);

  useEffect(() => () => sheetHeightAnim.stopAnimation(), [sheetHeightAnim]);

  return {
    sheetSnapIndex,
    snapTo,
    cycleSnap,
    sheetHeightAnim,
    sheetPanResponder,
    expandableContentOpacity,
  };
}
