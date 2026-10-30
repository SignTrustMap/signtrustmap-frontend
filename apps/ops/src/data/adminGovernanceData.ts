// Comprehensive dataset for Platform & Governance Admin Workspace strictly matching registered documents


export interface SpatialSignRecord {
  id: string
  signCode: string
  signName: string
  lat: number
  lng: number
  headingDeg: number
  direction: string
  roadName: string
  category: string
  verifiedAt: string
  status: 'Verified' | 'Flagged For Review' | 'Stale' | 'Malicious/Deleted'
  confidence: number
}

export const mockSpatialSigns: SpatialSignRecord[] = [
  {
    id: 'SIGN-VN-70891',
    signCode: 'P.127',
    signName: 'Tốc độ tối đa 80km/h',
    lat: 10.79812,
    lng: 106.72145,
    headingDeg: 120,
    direction: 'Đông Nam (Southeast)',
    roadName: 'Đường cao tốc Long Thành - Dầu Giây (Km 12+400)',
    category: 'prohibition',
    verifiedAt: '2026-07-15 09:30',
    status: 'Verified',
    confidence: 0.98,
  },
  {
    id: 'SIGN-VN-70892',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    lat: 10.77694,
    lng: 106.70091,
    headingDeg: 225,
    direction: 'Tây Nam (Southwest)',
    roadName: 'Đường Đồng Khởi, Bến Nghé, Quận 1',
    category: 'prohibition',
    verifiedAt: '2026-08-20 14:15',
    status: 'Verified',
    confidence: 0.95,
  },
  {
    id: 'SIGN-VN-70893',
    signCode: 'W.207a',
    signName: 'Giao nhau với đường không ưu tiên',
    lat: 10.82231,
    lng: 106.77198,
    headingDeg: 60,
    direction: 'Đông Bắc (Northeast)',
    roadName: 'Xa Lộ Hà Nội, Phường Linh Trung, TP. Thủ Đức',
    category: 'warning',
    verifiedAt: '2026-08-10 11:20',
    status: 'Flagged For Review',
    confidence: 0.82,
  },
  {
    id: 'SIGN-VN-70894',
    signCode: 'R.301a',
    signName: 'Hướng đi phải theo (Đi thẳng)',
    lat: 10.78512,
    lng: 106.70642,
    headingDeg: 340,
    direction: 'Bắc Tây Bắc (NNW)',
    roadName: 'Đại lộ Lê Duẩn, Bến Nghé, Quận 1',
    category: 'mandatory',
    verifiedAt: '2026-08-05 16:45',
    status: 'Verified',
    confidence: 0.96,
  },
  {
    id: 'SIGN-VN-70895',
    signCode: 'P.130',
    signName: 'Cấm dừng xe và đỗ xe',
    lat: 10.80321,
    lng: 106.71289,
    headingDeg: 195,
    direction: 'Nam Tây Nam (SSW)',
    roadName: 'Đường Điện Biên Phủ, Phường 25, Bình Thạnh',
    category: 'prohibition',
    verifiedAt: '2026-06-12 08:00',
    status: 'Stale',
    confidence: 0.76,
  },
  {
    id: 'SIGN-VN-70896',
    signCode: 'I.407a',
    signName: 'Đường một chiều',
    lat: 10.77123,
    lng: 106.69854,
    headingDeg: 15,
    direction: 'Bắc Đông Bắc (NNE)',
    roadName: 'Đường Nguyễn Thị Minh Khai, Quận 3',
    category: 'information',
    verifiedAt: '2026-08-25 10:30',
    status: 'Verified',
    confidence: 0.94,
  },
]


export interface ExportHistoryRecord {
  id: string
  format: 'GeoJSON (RFC 7946)' | 'ESRI Shapefile (.shp)' | 'CSV' | 'OSM XML'
  region: string
  totalFeatures: number
  fileSize: string
  exportedBy: string
  createdAt: string
}

export const mockExportHistory: ExportHistoryRecord[] = [
  {
    id: 'EXP-2026-104',
    format: 'GeoJSON (RFC 7946)',
    region: 'TP. Hồ Chí Minh & TP. Thủ Đức',
    totalFeatures: 18450,
    fileSize: '14.2 MB',
    exportedBy: 'admin@signtrustmap.site',
    createdAt: '2026-09-08 14:30',
  },
  {
    id: 'EXP-2026-103',
    format: 'ESRI Shapefile (.shp)',
    region: 'Hà Nội (Khu vực Vành đai 3)',
    totalFeatures: 12620,
    fileSize: '22.8 MB',
    exportedBy: 'admin@signtrustmap.site',
    createdAt: '2026-09-05 09:15',
  },
  {
    id: 'EXP-2026-102',
    format: 'OSM XML',
    region: 'Đà Nẵng & Quốc lộ 1A',
    totalFeatures: 4210,
    fileSize: '3.8 MB',
    exportedBy: 'admin@signtrustmap.site',
    createdAt: '2026-08-28 16:45',
  },
  {
    id: 'EXP-2026-101',
    format: 'CSV',
    region: 'Hải Phòng & Hạ Long',
    totalFeatures: 6890,
    fileSize: '2.1 MB',
    exportedBy: 'admin@signtrustmap.site',
    createdAt: '2026-08-20 11:20',
  },
]

