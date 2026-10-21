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
  onRerouteApplied,
  onClearNavigationError,
}: UseAutoRerouteProps) {
  const [rerouteOrigin, setRerouteOrigin] = useState<MapCoordinate>();
  const isReroutingRef = useRef(false);
  const consecutiveOffRouteCountRef = useRef(0);

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
    setRerouteOrigin([...userCoordinate]);
  }, [
    isNavigating,
    isCustomStart,
    hasLiveLocation,
    userCoordinate,
    routeCoordinates,
  ]);

  // Reset reroute lock and clear rerouteOrigin whenever new route coordinates arrive
  useEffect(() => {
    if (routeCoordinates?.length) {
      if (rerouteOrigin) {
        onRerouteApplied?.(rerouteOrigin);
        setRerouteOrigin(undefined);
      }
      isReroutingRef.current = false;
      consecutiveOffRouteCountRef.current = 0;
    }
  }, [routeCoordinates, rerouteOrigin, onRerouteApplied]);

  // Reset reroute state whenever the core destination changes
  useEffect(() => {
    setRerouteOrigin(undefined);
    isReroutingRef.current = false;
    consecutiveOffRouteCountRef.current = 0;
    onClearNavigationError?.();
  }, [destinationId, onClearNavigationError]);

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
