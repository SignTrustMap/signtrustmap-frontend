export type DriverRole = 'driver' | 'surveyor' | 'reviewer';

export type PreviousLocation = {
  id: string;
  title: string;
  subtitle: string;
  category: 'home' | 'work' | 'saved' | 'recent';
};

export type MapSignMarker = {
  coordinate: [longitude: number, latitude: number];
  id: string;
  top: `${number}%`;
  left: `${number}%`;
};

export const previousDriverLocations: PreviousLocation[] = [
  {
    id: 'fifth-ave',
    title: '5th Ave, New York',
    subtitle: 'Midtown Manhattan, near Central Park',
    category: 'recent',
  },
  {
    id: 'jfk-airport',
    title: 'JFK International Airport',
    subtitle: 'Queens, NY 11430',
    category: 'recent',
  },
  {
    id: 'brooklyn-bridge-park',
    title: 'Brooklyn Bridge Park',
    subtitle: '334 Furman St, Brooklyn, NY',
    category: 'recent',
  },
];

export const driverMapSignMarkers: MapSignMarker[] = [
  { id: 'sign-182', coordinate: [-73.9862, 40.7583], top: '29%', left: '24%' },
  { id: 'sign-219', coordinate: [-73.9812, 40.7557], top: '41%', left: '66%' },
  { id: 'sign-277', coordinate: [-73.9788, 40.7526], top: '53%', left: '82%' },
  { id: 'sign-304', coordinate: [-73.9902, 40.7506], top: '70%', left: '44%' },
];

export const driverCurrentLocation = {
  coordinate: [-73.9846, 40.7536] as [longitude: number, latitude: number],
  label: 'Current driver location',
};

export const openStreetMapTiles = [
  ['https://tile.openstreetmap.org/16/19297/24630.png', 'https://tile.openstreetmap.org/16/19298/24630.png'],
  ['https://tile.openstreetmap.org/16/19297/24631.png', 'https://tile.openstreetmap.org/16/19298/24631.png'],
  ['https://tile.openstreetmap.org/16/19297/24632.png', 'https://tile.openstreetmap.org/16/19298/24632.png'],
];
