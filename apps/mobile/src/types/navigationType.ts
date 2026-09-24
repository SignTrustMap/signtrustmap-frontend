export type VehicleModeId = "DRIVING" | "BIKE";

export type VehicleMode = { id: VehicleModeId; label: string };

export type MapCoordinate = [longitude: number, latitude: number];

export type PreviousLocation = {
  coordinate: MapCoordinate;
  id: string;
  title: string;
  subtitle: string;
  category: "home" | "work" | "saved" | "recent";
};

export type StartLocation = {
  coordinate: MapCoordinate;
  id: string;
  title: string;
  subtitle: string;
};

export type MapSignMarker = {
  coordinate: MapCoordinate;
  id: string;
  top: `${number}%`;
  left: `${number}%`;
};
