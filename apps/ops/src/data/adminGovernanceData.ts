// Comprehensive dataset for Platform & Governance Admin Workspace strictly matching registered documents

export interface AdminUserItem {
  id: string
  name: string
  email: string
  password?: string
  role: 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin'
  status: 'Active' | 'Suspended' | 'Pending'
  avatar?: string
  avatarBg?: string
  initials?: string
  phone?: string
  location?: string
  department?: string
  joinedAt: string
  lastActive?: string
  reliabilityScore?: number
  credits: number
  surveysSubmitted?: number
  reviewsCount?: number
  moderationHandled?: number
  distanceTraveled?: string
}

export const mockAdminUsers: AdminUserItem[] = [
  // ─── 5 Official Team Demo Accounts ─────────────────────────
  {
    id: 'USR-001',
    name: 'Phan Tài Đức',
    email: 'admin@signtrustmap.com',
    password: 'password123',
    role: 'admin',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=250&auto=format&fit=crop&q=80',
    avatarBg: 'bg-purple-600',
    initials: 'PĐ',
    phone: '0902244389',
    location: 'TP. Hồ Chí Minh',
    department: 'System Architecture & Platform Governance',
    joinedAt: '2025-10-01',
    lastActive: 'Vừa xong',
    credits: 99999,
  },
  {
    id: 'USR-002',
    name: 'Nguyễn Long Vũ',
    email: 'staff@signtrustmap.com',
    password: 'password123',
    role: 'staff',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=250&auto=format&fit=crop&q=80',
    avatarBg: 'bg-teal-600',
    initials: 'NV',
    phone: '0838474060',
    location: 'TP. Hồ Chí Minh',
    department: 'Verification Operations & Triage Moderation',
    joinedAt: '2025-11-15',
    lastActive: '12 phút trước',
    moderationHandled: 342,
    credits: 12000,
  },
  {
    id: 'USR-003',
    name: 'Nguyễn Lê Quang Hưng',
    email: 'reviewer@signtrustmap.com',
    password: 'password123',
    role: 'reviewer',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=250&auto=format&fit=crop&q=80',
    avatarBg: 'bg-emerald-600',
    initials: 'NH',
    phone: '0898492655',
    location: 'TP. Hồ Chí Minh',
    reliabilityScore: 0.98,
    reviewsCount: 890,
    joinedAt: '2026-01-10',
    lastActive: '25 phút trước',
    credits: 3850,
  },
  {
    id: 'USR-004',
    name: 'Nguyễn Phúc Khang',
    email: 'surveyor@signtrustmap.com',
    password: 'password123',
    role: 'surveyor',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=250&auto=format&fit=crop&q=80',
    avatarBg: 'bg-blue-600',
    initials: 'NK',
    phone: '0762904851',
    location: 'TP. Hồ Chí Minh',
    reliabilityScore: 0.95,
    surveysSubmitted: 48,
    joinedAt: '2026-02-15',
    lastActive: '1 giờ trước',
    credits: 2450,
  },
  {
    id: 'USR-005',
    name: 'Lương Minh Nhật',
    email: 'driver@signtrustmap.com',
    password: 'password123',
    role: 'driver',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=250&auto=format&fit=crop&q=80',
    avatarBg: 'bg-amber-600',
    initials: 'LN',
    phone: '0378160061',
    location: 'TP. Hồ Chí Minh',
    distanceTraveled: '1,250 km',
    joinedAt: '2026-03-01',
    lastActive: '2 giờ trước',
    credits: 850,
  },

  // ─── Additional Personnel & Community Accounts ──────────────
  {
    id: 'USR-006',
    name: 'Đặng Ngọc Minh Đức',
    email: 'ducdnm2@fe.edu.vn',
    role: 'admin',
    status: 'Active',
    avatarBg: 'bg-purple-700',
    initials: 'ĐĐ',
    phone: '0989699299',
    location: 'Hà Nội (FPTU)',
    department: 'Project Supervisor & Academic Quality',
    joinedAt: '2025-09-01',
    lastActive: '3 giờ trước',
    credits: 50000,
  },
  {
    id: 'USR-007',
    name: 'Thân Thị Ngọc Vân',
    email: 'vanttn2@fe.edu.vn',
    role: 'staff',
    status: 'Active',
    avatarBg: 'bg-indigo-600',
    initials: 'TV',
    location: 'TP. Hồ Chí Minh (FPTU)',
    department: 'Co-supervisor & Operations Auditing',
    moderationHandled: 128,
    joinedAt: '2025-09-01',
    lastActive: '5 giờ trước',
    credits: 25000,
  },
  {
    id: 'USR-008',
    name: 'Trần Văn Hoàng (Fraud Flagged)',
    email: 'hoang.gps.fake@gmail.com',
    role: 'surveyor',
    status: 'Suspended',
    avatarBg: 'bg-red-600',
    initials: 'TH',
    location: 'Đà Nẵng',
    reliabilityScore: 0.32,
    surveysSubmitted: 14,
    joinedAt: '2026-08-10',
    lastActive: '1 ngày trước',
    credits: 0,
  },
  {
    id: 'USR-009',
    name: 'Lê Thị Mai (Community Lead)',
    email: 'mai.le@signtrustmap.site',
    role: 'reviewer',
    status: 'Active',
    avatarBg: 'bg-emerald-600',
    initials: 'LM',
    location: 'TP. Hồ Chí Minh',
    reliabilityScore: 0.96,
    reviewsCount: 450,
    joinedAt: '2026-04-12',
    lastActive: 'Hôm qua',
    credits: 1920,
  },
  {
    id: 'USR-010',
    name: 'Phạm Tuấn Anh',
    email: 'tuananh.driver@gmail.com',
    role: 'driver',
    status: 'Active',
    avatarBg: 'bg-slate-600',
    initials: 'PA',
    location: 'Bình Dương',
    distanceTraveled: '480 km',
    joinedAt: '2026-06-20',
    lastActive: '3 ngày trước',
    credits: 320,
  },
  {
    id: 'USR-011',
    name: 'Võ Minh Trí',
    email: 'tri.vo.survey@signtrustmap.site',
    role: 'surveyor',
    status: 'Active',
    avatarBg: 'bg-cyan-600',
    initials: 'VT',
    location: 'Cần Thơ',
    reliabilityScore: 0.89,
    surveysSubmitted: 22,
    joinedAt: '2026-07-05',
    lastActive: '2 ngày trước',
    credits: 1150,
  },
  {
    id: 'USR-012',
    name: 'Hoàng Kim Ngân',
    email: 'ngan.reviewer@signtrustmap.site',
    role: 'reviewer',
    status: 'Active',
    avatarBg: 'bg-teal-600',
    initials: 'HN',
    location: 'Hải Phòng',
    reliabilityScore: 0.92,
    reviewsCount: 310,
    joinedAt: '2026-05-18',
    lastActive: '4 giờ trước',
    credits: 1450,
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
    escalatedBy: 'Staff Nguyễn Long Vũ',
    escalatedAt: '2026-08-30 15:30',
    summary: 'Ghi đè biển báo P.127 (Tốc độ tối đa 80km/h) trên Cao tốc Long Thành - Dầu Giây do bất đồng 50/50 phiếu Reviewer.',
    reason: 'Trường hợp dữ liệu đã xuất bản vào kho xác thực, cần quyền quản trị Admin để điều chỉnh thuộc tính không gian và vector góc nhìn.',
    affectedResource: 'SIGN-VN-70891 (Cao tốc Long Thành)',
    status: 'Pending Admin Review',
  },
  {
    id: 'ESC-2026-002',
    type: 'Catalog Modification',
    priority: 'High',
    escalatedBy: 'Staff Lương Minh Nhật',
    escalatedAt: '2026-08-30 14:10',
    summary: 'Đề xuất bổ sung biển báo điện tử LED thay đổi tốc độ linh hoạt (chưa có trong QCVN 41:2019) và cập nhật nhãn AI CLIP.',
    reason: 'Khảo sát viên phát hiện biển báo điện tử ma trận tại trạm thu phí. Cần Admin xem xét ban hành phiên bản Catalog mới.',
    affectedResource: 'CATALOG-PROP-089 (Biển báo LED)',
    status: 'Pending Admin Review',
  },
  {
    id: 'ESC-2026-003',
    type: 'Credit Discrepancy',
    priority: 'High',
    escalatedBy: 'Staff Nguyễn Long Vũ',
    escalatedAt: '2026-08-29 16:45',
    summary: 'Yêu cầu xử lý bồi hoàn giao dịch nạp tiền 50,000 PTS qua Payment Gateway bị gián đoạn xác nhận webhook callback.',
    reason: 'Người dùng đã bị trừ tiền trên tài khoản ngân hàng nhưng ví Credits chưa cộng điểm. Cần Admin đối soát và phê duyệt cộng bù.',
    affectedResource: 'TX-PAYMENT-994812 (USR-010)',
    status: 'Pending Admin Review',
  },
  {
    id: 'ESC-2026-004',
    type: 'Privileged Moderation',
    priority: 'Critical',
    escalatedBy: 'Staff Lương Minh Nhật',
    escalatedAt: '2026-08-29 11:20',
    summary: 'Phát hiện hành vi gian lận dữ liệu GPS (GPS Spoofing) tốc độ 250km/h trong khu vực đô thị để farm điểm thưởng.',
    reason: 'Vượt quá thẩm quyền xử phạt của Staff. Đề xuất Admin thu hồi toàn bộ 5,000 PTS và đình chỉ vĩnh viễn tài khoản vi phạm.',
    affectedResource: 'USR-FRAUD-882 (Khảo sát viên gian lận)',
    status: 'Pending Admin Review',
  },
  {
    id: 'ESC-2026-005',
    type: 'Spatial Override',
    priority: 'Medium',
    escalatedBy: 'Staff Nguyễn Long Vũ',
    escalatedAt: '2026-08-28 09:15',
    summary: 'Đề nghị gỡ bỏ biển cấm rẽ P.123a tại nút giao do công trình thi công đã hoàn tất và biển đã được dỡ bỏ thực tế.',
    reason: 'Biển báo đã vào trạng thái Verified nhưng nhiều tài xế báo cáo thực tế đã thông đường. Đề xuất hủy kích hoạt.',
    affectedResource: 'SIGN-VN-44012 (Nguyễn Huệ - Lê Lợi)',
    status: 'Resolved',
  },
  {
    id: 'ESC-2026-006',
    type: 'Catalog Modification',
    priority: 'Medium',
    escalatedBy: 'Staff Lương Minh Nhật',
    escalatedAt: '2026-08-27 17:00',
    summary: 'Đề xuất gộp biển báo phụ S.509a vào nhóm biển báo chính P.102 để tinh gọn tập dữ liệu huấn luyện YOLO12.',
    reason: 'Reviewer thường xuyên nhầm lẫn giữa 2 nhóm biển này. Staff đề xuất hợp nhất quy tắc OSM tag mapping.',
    affectedResource: 'CATALOG-MERGE-014 (S.509a)',
    status: 'Rejected',
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

