import type { MapCoordinate, VehicleModeId, VehicleType } from "@/types/navigationType";
import type { RouteSign } from "@/api/navigation/navigation";
import { resolveRoutingModeAndType } from "@/api/navigation/navigation";

/**
 * Feature flag for Crescent Mall -> Bitexco car-only sign demo.
 * Set to false to disable all demo overrides in production.
 */
export const ENABLE_DEMO_CAR_ONLY_SIGN = true;

/** Coordinates for Crescent Mall [lon, lat] */
export const CRESCENT_MALL_COORDINATE: MapCoordinate = [106.717336, 10.728561];

/** Coordinates for Bitexco Financial Tower [lon, lat] */
export const BITEXCO_COORDINATE: MapCoordinate = [106.704688, 10.771674];

/**
 * Checks if the current route connects Crescent Mall (District 7) and
 * Bitexco Financial Tower (District 1) within ~500m tolerance.
 */
export function isCrescentMallToBitexcoRoute(
  origin?: MapCoordinate | null,
  destination?: MapCoordinate | null,
): boolean {
  if (!origin || !destination) return false;
  const originDiff =
    Math.abs(origin[0] - CRESCENT_MALL_COORDINATE[0]) +
    Math.abs(origin[1] - CRESCENT_MALL_COORDINATE[1]);
  const destDiff =
    Math.abs(destination[0] - BITEXCO_COORDINATE[0]) +
    Math.abs(destination[1] - BITEXCO_COORDINATE[1]);
  return originDiff < 0.006 && destDiff < 0.006;
}

/**
 * Demo-only function: Modifies the props of the first sign on the route
 * to be allowed strictly for cars only (`['CAR']`), removing all other vehicle allowances.
 */
export function modifyFirstSignForCarsOnly(signs: RouteSign[]): RouteSign[] {
  if (!signs || signs.length === 0) return signs;

  return signs.map((sign, index) => {
    if (index === 0) {
      const carOnlySuffix = " (Chỉ ô tô)";
      const displayName = sign.name.includes(carOnlySuffix)
        ? sign.name
        : `${sign.name}${carOnlySuffix}`;
      const displayNameVi = sign.nameVi && !sign.nameVi.includes(carOnlySuffix)
        ? `${sign.nameVi}${carOnlySuffix}`
        : sign.nameVi;

      return {
        ...sign,
        allowedVehicles: ["CAR"] as VehicleType[],
        name: displayName,
        nameVi: displayNameVi,
      };
    }
    return sign;
  });
}

/**
 * Filters signs by the active vehicle type.
 * If a sign defines `allowedVehicles`, it is only kept if the current vehicle type
 * is included in its allowed list.
 */
export function filterSignsByVehicleType(
  signs: RouteSign[],
  vehicleMode: VehicleModeId = "DRIVING",
): RouteSign[] {
  const { vehicleType } = resolveRoutingModeAndType(vehicleMode);
  return signs.filter((sign) => {
    if (!sign.allowedVehicles || sign.allowedVehicles.length === 0) {
      return true; // No vehicle restriction -> visible to all
    }
    return sign.allowedVehicles.includes(vehicleType);
  });
}

/**
 * Main demo pipeline for Crescent Mall -> Bitexco route:
 * 1. Checks if the route is Crescent Mall -> Bitexco.
 * 2. If so, applies `modifyFirstSignForCarsOnly`.
 * 3. Filters signs against the active vehicle mode (Car vs Motorcycle/Bike).
 */
export function applyDemoRouteSigns(
  signs: RouteSign[],
  origin?: MapCoordinate | null,
  destination?: MapCoordinate | null,
  vehicleMode: VehicleModeId = "DRIVING",
): RouteSign[] {
  if (!ENABLE_DEMO_CAR_ONLY_SIGN) {
    return signs;
  }

  const isDemoRoute = isCrescentMallToBitexcoRoute(origin, destination);
  if (!isDemoRoute) {
    return filterSignsByVehicleType(signs, vehicleMode);
  }

  const modified = modifyFirstSignForCarsOnly(signs);
  return filterSignsByVehicleType(modified, vehicleMode);
}
