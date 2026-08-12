export type DriverRole = 'driver' | 'surveyor' | 'reviewer';

export type MapCoordinate = [longitude: number, latitude: number];

export type PreviousLocation = {
  coordinate: MapCoordinate;
  id: string;
  title: string;
  subtitle: string;
  category: 'home' | 'work' | 'saved' | 'recent';
};

export type DriverStartLocation = {
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

export const previousDriverLocations: PreviousLocation[] = [
  {
    coordinate: [106.691383, 10.770046],
    id: 'metro-ben-thanh',
    title: 'Ga Metro Bến Thành',
    subtitle: 'Gần chợ Bến Thành, Thành phố Hồ Chí Minh',
    category: 'recent',
  },
  {
    coordinate: [106.80988299558288, 10.841285649563071],
    id: 'dai-hoc-fpt',
    title: 'Trường Đại học FPT',
    subtitle: 'Khu Công nghệ cao, Thành phố Hồ Chí Minh',
    category: 'recent',
  },
  {
    coordinate: [106.80071256674707, 10.87521547849516],
    id: 'nha-van-hoa-sinh-vien',
    title: 'Nhà Văn hóa Sinh viên',
    subtitle: 'Khu đô thị Đại học Quốc gia Thành phố Hồ Chí Minh',
    category: 'recent',
  },
];

export const driverStartLocations: DriverStartLocation[] = [
  {
    coordinate: [106.80988299558288, 10.841285649563071],
    id: 'dai-hoc-fpt',
    title: 'Trường Đại học FPT',
    subtitle: 'Khu Công nghệ cao, Thành phố Hồ Chí Minh',
  },
  {
    coordinate: [106.691383, 10.770046],
    id: 'metro-ben-thanh',
    title: 'Ga Metro Bến Thành',
    subtitle: 'Gần chợ Bến Thành, Thành phố Hồ Chí Minh',
  },
  {
    coordinate: [106.80071256674707, 10.87521547849516],
    id: 'nha-van-hoa-sinh-vien',
    title: 'Nhà Văn hóa Sinh viên',
    subtitle: 'Số 1 Lưu Hữu Phước, Thành phố Hồ Chí Minh',
  },
  {
    coordinate: [106.75486531627588, 10.63528464347232],
    id: 'truong-thpt-mac-dinh-chi',
    title: 'Trường THPT Mạc Đĩnh Chi',
    subtitle: 'Thành phố Hồ Chí Minh',
  },
  {
    coordinate: [106.8107, 10.879],
    id: 'ben-xe-mien-dong-moi',
    title: 'Bến xe Miền Đông mới',
    subtitle: 'Đường Hoàng Hữu Nam, Thành phố Hồ Chí Minh',
  },
];

export const driverMapSignMarkers: MapSignMarker[] = [
  { id: 'bien-bao-182', coordinate: [106.8048, 10.8482], top: '29%', left: '24%' },
  { id: 'bien-bao-219', coordinate: [106.8112, 10.846], top: '41%', left: '66%' },
  { id: 'bien-bao-277', coordinate: [106.814, 10.8428], top: '53%', left: '82%' },
  { id: 'bien-bao-304', coordinate: [106.8061, 10.8399], top: '70%', left: '44%' },
];

export const driverCurrentLocation = {
  coordinate: [106.8075, 10.845] as MapCoordinate,
  label: 'Vị trí hiện tại của tài xế',
};

export const openStreetMapTiles = [
  ['https://tile.openstreetmap.org/16/52210/30780.png', 'https://tile.openstreetmap.org/16/52211/30780.png'],
  ['https://tile.openstreetmap.org/16/52210/30781.png', 'https://tile.openstreetmap.org/16/52211/30781.png'],
  ['https://tile.openstreetmap.org/16/52210/30782.png', 'https://tile.openstreetmap.org/16/52211/30782.png'],
];
