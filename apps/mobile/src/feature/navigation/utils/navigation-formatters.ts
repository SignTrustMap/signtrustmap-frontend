import type { NavigationStep } from "@/api/navigation/navigation";

export function formatRouteInstruction(step: NavigationStep): string {
  return step.instruction;
}

export function getManeuverSymbol(step: NavigationStep): string {
  if (step.maneuver.type === "arrive") return "●";
  if (step.maneuver.type === "roundabout" || step.maneuver.type === "rotary")
    return "↻";

  const instruction = step.instruction.toLowerCase();
  if (instruction.includes("left")) return "↖";
  if (instruction.includes("right")) return "↗";
  if (instruction.includes("u-turn")) return "↶";

  return "↑";
}

export function formatManeuverDistance(distanceInMeters: number): string {
  if (distanceInMeters < 20) return "Bây giờ";
  if (distanceInMeters < 1000)
    return `${Math.max(10, Math.round(distanceInMeters / 10) * 10)} m`;

  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

export function formatRouteDistanceInKilometers(distanceInMeters: number): string {
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(durationInSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(durationInSeconds / 60));

  if (totalMinutes < 60) return `${totalMinutes} phút`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function formatRouteEstimatedTime(durationInSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(durationInSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} phút`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function formatRouteNavDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function formatRouteArrivalTime(durationInSeconds: number): string {
  const arrivalDate = new Date(Date.now() + durationInSeconds * 1000);
  const hours = arrivalDate.getHours();
  const minutes = arrivalDate.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
