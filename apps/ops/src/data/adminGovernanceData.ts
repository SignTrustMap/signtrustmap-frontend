// Comprehensive dataset for Platform & Governance Admin Workspace strictly matching registered documents

export interface AdminUserItem {
  id: string
  name: string
  email: string
  role: 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin'
  status: 'Active' | 'Suspended' | 'Pending'
  reliabilityScore?: number
  credits: number
  joinedAt: string
  surveysSubmitted?: number
  reviewsCount?: number
  moderationHandled?: number
  avatarBg: string
}

export const mockAdminUsers: AdminUserItem[] = [
  {
    id: 'USR-1001',
    name: 'Phan Tài Đức',
    email: 'surveyor.duc@signtrustmap.site',
    role: 'surveyor',
    status: 'Active',
    reliabilityScore: 0.96,
    credits: 2450,
    joinedAt: '2026-01-15',
    surveysSubmitted: 48,
    avatarBg: 'bg-blue-600',
  },
  {
    id: 'USR-1002',
    name: 'Nguyễn Lê Quang Hưng',
    email: 'reviewer.hung@signtrustmap.site',
    role: 'reviewer',
    status: 'Active',
    reliabilityScore: 0.94,
    credits: 3820,
    joinedAt: '2026-02-01',
    reviewsCount: 842,
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'USR-1003',
    name: 'Lương Minh Nhật',
    email: 'staff.nhat@signtrustmap.site',
    role: 'staff',
    status: 'Active',
    credits: 12000,
    joinedAt: '2025-11-20',
    moderationHandled: 312,
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'USR-1004',
    name: 'Platform Governance Admin',
    email: 'admin@signtrustmap.site',
    role: 'admin',
    status: 'Active',
    credits: 99999,
    joinedAt: '2025-10-01',
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'USR-1005',
    name: 'Nguyễn Văn Nam (Driver)',
    email: 'nam.driver@gmail.com',
    role: 'driver',
    status: 'Active',
    credits: 350,
    joinedAt: '2026-03-12',
    avatarBg: 'bg-teal-600',
  },
  {
    id: 'USR-1006',
    name: 'Trần Văn Hoàng (Suspicious)',
    email: 'hoang.gps.fake@gmail.com',
    role: 'surveyor',
    status: 'Suspended',
    reliabilityScore: 0.32,
    credits: 0,
    joinedAt: '2026-08-10',
    surveysSubmitted: 14,
    avatarBg: 'bg-red-600',
  },
]

export interface AdminEscalationCase {
  id: string
  type: 'Spatial Override' | 'Catalog Modification' | 'Credit Discrepancy' | 'Privileged Moderation'
  priority: 'Critical' | 'High' | 'Medium'
  escalatedBy: string
  escalatedAt: string
  summary: string
  reason: string
  affectedResource: string
  status: 'Pending Admin Review' | 'Resolved' | 'Rejected'
}

export const mockAdminEscalations: AdminEscalationCase[] = [
  {
    id: 'ESC-2026-001',
    type: 'Spatial Override',
    priority: 'Critical',
    escalatedBy: 'Staff Lương Minh Nhật',
    escalatedAt: '2026-08-30 15:30',
    summary: 'Yêu cầu override biển báo P.127 bị gán nhầm vector hướng đi trên tuyến đường chính.',
    reason: 'Trường hợp dữ liệu đã xuất bản vào kho xác thực, cần quyền quản trị Admin để điều chỉnh thuộc tính không gian.',
    affectedResource: 'SIGN-VN-70891 (Highway Segment)',
    status: 'Pending Admin Review',
  },
  {
    id: 'ESC-2026-002',
    type: 'Credit Discrepancy',
    priority: 'High',
    escalatedBy: 'Staff Lương Minh Nhật',
    escalatedAt: '2026-08-30 14:10',
    summary: 'Yêu cầu xử lý bồi hoàn giao dịch nạp tiền qua Payment Gateway bị gián đoạn xác nhận callback.',
    reason: 'Trường hợp bất thường về giao dịch nạp điểm cần Admin đối soát và phê duyệt bồi hoàn.',
    affectedResource: 'TX-PAYMENT-994812 (User USR-1002)',
    status: 'Pending Admin Review',
  },
]

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
    lat: 10.7981,
    lng: 106.7214,
    headingDeg: 120,
    direction: 'Southeast',
    roadName: 'Đường cao tốc Long Thành - Dầu Giây',
    category: 'prohibition',
    verifiedAt: '2026-07-15',
    status: 'Verified',
    confidence: 0.98,
  },
  {
    id: 'SIGN-VN-70892',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    lat: 10.7769,
    lng: 106.7009,
    headingDeg: 225,
    direction: 'Southwest',
    roadName: 'Đường Đồng Khởi, Quận 1',
    category: 'prohibition',
    verifiedAt: '2026-08-20',
    status: 'Verified',
    confidence: 0.95,
  },
  {
    id: 'SIGN-VN-70893',
    signCode: 'W.207a',
    signName: 'Giao nhau với đường không ưu tiên',
    lat: 10.8223,
    lng: 106.7719,
    headingDeg: 60,
    direction: 'Northeast',
    roadName: 'Xa Lộ Hà Nội, TP. Thủ Đức',
    category: 'warning',
    verifiedAt: '2026-08-10',
    status: 'Flagged For Review',
    confidence: 0.82,
  },
]

export interface ModelRetrainingRun {
  id: string
  modelName: 'YOLO12-Detector' | 'CLIP-ZeroShot-Classifier'
  version: string
  triggeredBy: string
  startedAt: string
  duration: string
  trainingSamplesCount: number
  metricBefore: number
  metricAfter: number
  metricGain: string
  status: 'Active Deployed' | 'Ready for Deployment' | 'Evaluating' | 'Failed'
}

export const mockTrainingRuns: ModelRetrainingRun[] = [
  {
    id: 'RUN-2026-08',
    modelName: 'YOLO12-Detector',
    version: 'yolo12-stm-v2.3',
    triggeredBy: 'Scheduled Active Learning Cycle',
    startedAt: '2026-08-28 02:00',
    duration: '4h 12m',
    trainingSamplesCount: 14500,
    metricBefore: 88.4,
    metricAfter: 91.2,
    metricGain: '+2.8%',
    status: 'Active Deployed',
  },
  {
    id: 'RUN-2026-07',
    modelName: 'CLIP-ZeroShot-Classifier',
    version: 'clip-vit-b32-taxonomy-v2.1',
    triggeredBy: 'Catalog Update (Synchronized approved sign types)',
    startedAt: '2026-08-25 18:30',
    duration: '1h 05m',
    trainingSamplesCount: 6200,
    metricBefore: 92.1,
    metricAfter: 94.6,
    metricGain: '+2.5%',
    status: 'Active Deployed',
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
    createdAt: '2026-08-30 08:30',
  },
  {
    id: 'EXP-2026-103',
    format: 'OSM XML',
    region: 'Khu vực Trung tâm Đô thị',
    totalFeatures: 4210,
    fileSize: '3.8 MB',
    exportedBy: 'admin@signtrustmap.site',
    createdAt: '2026-08-28 16:45',
  },
]
