import { useEffect, useRef, useState } from "react";
import type { MapCoordinate } from "@/types/navigationType";
import { getDistanceToRouteMeters } from "../utils/geo";

const OFF_ROUTE_THRESHOLD_METERS = 45;

export interface UseAutoRerouteProps {
  isNavigating: boolean;
  isCustomStart: boolean;
  hasLiveLocation: boolean;
  userCoordinate?: MapCoordinate;
  routeCoordinates?: MapCoordinate[];
  destinationId?: string;
  onRerouteTriggered?: (newOrigin: MapCoordinate) => void;
  onRerouteApplied?: (newOrigin: MapCoordinate) => void;
  onClearNavigationError?: () => void;
}

export function useAutoReroute({
  isNavigating,
  isCustomStart,
  hasLiveLocation,
  userCoordinate,
  routeCoordinates,
  destinationId,
  onRerouteTriggered,
  onRerouteApplied,
  onClearNavigationError,
}: UseAutoRerouteProps) {
  const [rerouteOrigin, setRerouteOrigin] = useState<MapCoordinate>();
  const isReroutingRef = useRef(false);
  const consecutiveOffRouteCountRef = useRef(0);
  const prevRouteKeyRef = useRef<string>("");

  const onRerouteTriggeredRef = useRef(onRerouteTriggered);
  onRerouteTriggeredRef.current = onRerouteTriggered;
  const onRerouteAppliedRef = useRef(onRerouteApplied);
  onRerouteAppliedRef.current = onRerouteApplied;
  const onClearNavigationErrorRef = useRef(onClearNavigationError);
  onClearNavigationErrorRef.current = onClearNavigationError;

  useEffect(() => {
    if (
      !isNavigating ||
      isCustomStart ||
      !hasLiveLocation ||
      !userCoordinate ||
      !routeCoordinates?.length
    ) {
      consecutiveOffRouteCountRef.current = 0;
      return;
    }

    const distToRoute = getDistanceToRouteMeters(userCoordinate, routeCoordinates);
    if (distToRoute <= OFF_ROUTE_THRESHOLD_METERS) {
      consecutiveOffRouteCountRef.current = 0;
      isReroutingRef.current = false;
      return;
    }

    consecutiveOffRouteCountRef.current += 1;
    console.log(
      `[GPS] Off-route reading (${consecutiveOffRouteCountRef.current}/3): ${distToRoute.toFixed(1)}m from route`,
    );

    if (consecutiveOffRouteCountRef.current < 3) return;

    if (isReroutingRef.current) return;

    isReroutingRef.current = true;
    console.log(
      "[GPS] Triggering auto-reroute from current GPS position:",
      userCoordinate,
    );
    const newOrigin = [...userCoordinate] as MapCoordinate;
    setRerouteOrigin(newOrigin);
    onRerouteTriggeredRef.current?.(newOrigin);
  }, [
    isNavigating,
    isCustomStart,
    hasLiveLocation,
    userCoordinate,
    routeCoordinates,
  ]);

  // Reset reroute lock and clear rerouteOrigin whenever genuinely new route coordinates arrive
  useEffect(() => {
    if (!routeCoordinates?.length) return;
    const currentRouteKey = `${routeCoordinates[0]?.[0]},${routeCoordinates[0]?.[1]}:${routeCoordinates.length}`;
    if (prevRouteKeyRef.current !== currentRouteKey) {
      prevRouteKeyRef.current = currentRouteKey;
      if (rerouteOrigin) {
        onRerouteAppliedRef.current?.(rerouteOrigin);
        setRerouteOrigin(undefined);
      }
      isReroutingRef.current = false;
      consecutiveOffRouteCountRef.current = 0;
    }
  }, [routeCoordinates, rerouteOrigin]);

  // Reset reroute state whenever the core destination changes
  useEffect(() => {
    setRerouteOrigin(undefined);
    isReroutingRef.current = false;
    consecutiveOffRouteCountRef.current = 0;
    onClearNavigationErrorRef.current?.();
  }, [destinationId]);

  const resetReroute = () => {
    setRerouteOrigin(undefined);
    isReroutingRef.current = false;
    consecutiveOffRouteCountRef.current = 0;
  };

  return {
    rerouteOrigin,
    resetReroute,
  };
}
