import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import type { MapCoordinate } from "@/types/navigationType";
import { getMapLibre } from "@/services/maplibre";
import {
  ensureLocationPermission,
  fetchFreshGpsPosition,
  isValidGpsLocation,
} from "../utils/gps";

export function useNativeGps(initialCoord?: MapCoordinate) {
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate | undefined>(
    initialCoord,
  );
  const isListeningGpsRef = useRef(false);

  const handleLocationUpdate = useCallback((position: any) => {
    if (!isValidGpsLocation(position)) return;
    const { longitude, latitude, accuracy } = position.coords;
    const timestamp = position.timestamp;
    console.log("[GPS] location update", {
      latitude,
      longitude,
      accuracy,
      timestamp,
    });
    const newCoord: MapCoordinate = [longitude, latitude];
    setUserCoordinate(newCoord);
  }, []);

  const startGpsListening = useCallback(async (): Promise<MapCoordinate | null> => {
    if (Platform.OS === "web") return null;

    const mapLibre = getMapLibre();
    if (!mapLibre) return null;

    try {
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) return null;

      mapLibre.LocationManager.setMinDisplacement(0);
      if (!isListeningGpsRef.current) {
        mapLibre.LocationManager.addListener(handleLocationUpdate);
        isListeningGpsRef.current = true;
        console.log("[GPS] Continuous native location listener registered");
      }

      const initialPos = await fetchFreshGpsPosition(3500);
      if (initialPos) {
        setUserCoordinate(initialPos);
        return initialPos;
      }
    } catch (error) {
      console.error("[GPS] Error setting up LocationManager listener:", error);
    }
    return null;
  }, [handleLocationUpdate]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    void startGpsListening();

    return () => {
      const mapLibre = getMapLibre();
      if (mapLibre && isListeningGpsRef.current) {
        try {
          mapLibre.LocationManager.removeListener(handleLocationUpdate);
          isListeningGpsRef.current = false;
          console.log("[GPS] Continuous native location listener removed on unmount");
        } catch (error) {
          console.error("[GPS] Error removing LocationManager listener:", error);
        }
      }
    };
  }, [handleLocationUpdate, startGpsListening]);

  return {
    userCoordinate,
    setUserCoordinate,
    startGpsListening,
  };
}
