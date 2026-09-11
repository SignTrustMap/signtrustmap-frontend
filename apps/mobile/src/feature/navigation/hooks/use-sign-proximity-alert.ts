import { useEffect, useMemo, useRef } from 'react';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/feature/navigation/data/navigation-locations';
import { speechService } from '@/services/speech';
import { calculateDistanceMeters } from '../utils/geo';

export type SignProximityAlert = {
  sign: RouteSign;
  distanceMeters: number;
};

type UseSignProximityAlertOptions = {
  /** Distance threshold in meters to trigger proximity alert. Defaults to 50. */
  alertDistanceMeters?: number;
  /** Whether the user is actively navigating. */
  isNavigating: boolean;
  /** Traffic signs along the route or visible on the map. */
  signs?: RouteSign[];
  /** Current user coordinate [longitude, latitude]. */
  userCoordinate?: MapCoordinate;
  /** Optional language code for TTS (e.g., 'en-US', 'vi-VN'). */
  speechLanguage?: string;
  /** Whether TTS voice announcement is enabled. Defaults to true. */
  ttsEnabled?: boolean;
};

export function useSignProximityAlert({
  alertDistanceMeters = 50,
  isNavigating,
  signs = [],
  userCoordinate,
  speechLanguage,
  ttsEnabled = true,
}: UseSignProximityAlertOptions) {
  // Keep track of announced sign IDs so we don't repeatedly announce the same sign
  const announcedSignIdsRef = useRef<Set<string>>(new Set());

  // Derive active proximity alert during render instead of in an effect
  const activeAlert: SignProximityAlert | null = useMemo(() => {
    if (!isNavigating || !userCoordinate || signs.length === 0) {
      return null;
    }

    let nearestSign: RouteSign | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const sign of signs) {
      const distance = calculateDistanceMeters(userCoordinate, sign.coordinate);
      if (distance <= alertDistanceMeters) {
        if (distance < minDistance) {
          minDistance = distance;
          nearestSign = sign;
        }
      }
    }

    if (nearestSign && minDistance <= alertDistanceMeters) {
      return {
        sign: nearestSign,
        distanceMeters: Math.round(minDistance),
      };
    }

    return null;
  }, [alertDistanceMeters, isNavigating, signs, userCoordinate]);

  // Handle external synchronization (TTS audio playback & reset)
  useEffect(() => {
    if (!isNavigating) {
      announcedSignIdsRef.current.clear();
      speechService.stop();
      return;
    }

    if (activeAlert) {
      const { sign } = activeAlert;
      if (!announcedSignIdsRef.current.has(sign.id)) {
        announcedSignIdsRef.current.add(sign.id);

        if (ttsEnabled) {
          const signName = sign.name || sign.signCode || 'Traffic sign';
          const spokenText = `${signName} ahead`;
          speechService.speak(spokenText, {
            language: speechLanguage,
          });
        }
      }
    }
  }, [activeAlert, isNavigating, speechLanguage, ttsEnabled]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  return {
    activeAlert,
    clearAnnouncedSigns: () => announcedSignIdsRef.current.clear(),
  };
}
