import type { MapCoordinate } from '@/feature/navigation/data/navigation-locations';

const COORDINATE_EPSILON = 0.000001;

export function areSameLocation(
  first: MapCoordinate | undefined,
  second: MapCoordinate | undefined,
) {
  if (!first || !second) return false;

  return (
    Math.abs(first[0] - second[0]) < COORDINATE_EPSILON &&
    Math.abs(first[1] - second[1]) < COORDINATE_EPSILON
  );
}
