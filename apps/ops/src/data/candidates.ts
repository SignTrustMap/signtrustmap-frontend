export type CandidateStatus = 'Chưa xử lý' | 'Đang xem xét' | 'Đã giải quyết'
export type PriorityLevel = 'Cao' | 'Vừa' | 'Thấp'

export interface CandidateItem {
  id: string
  name: string
  reportedDate: string
  reason: string
  priority: PriorityLevel
  status: CandidateStatus
  signCode?: string
  signName?: string
  anomalyType?: 'conflict' | 'low_conf' | 'gps_offset' | 'blur'
  location?: string
  surveyorName?: string
  aiConfidence?: number
  cropImageUrl?: string
  contextImageUrl?: string
  gpsOffset?: number
}

export interface CandidateAuditLogItem {
  id: string
  logKey: string
  time: string
  actor: string
}

export interface CandidateSurveyorProfile {
  name: string
  initials: string
  levelKey: string
  trustScore: number
  totalRuns: number
  accuracyRate: number
}

export interface CandidateDetailData {
  id: string
  predictedLabel: string
  yoloConfidence: number
  clipConfidence: number
  lat: number
  lng: number
  heading: number
  consensusApprove: number
  consensusReject: number
  cropImageUrl: string
  cropImageHdUrl: string
  cropFileName: string
  contextImageUrl: string
  contextImageHdUrl: string
  contextFileName: string
  surveyor: CandidateSurveyorProfile
  auditLogs: CandidateAuditLogItem[]
}

export const mockCandidates: CandidateItem[] = [
  {
    id: '#RC-8924-A',
    name: 'P.102 - Cấm đi ngược chiều',
    reportedDate: '24/10/2026',
    reason: 'Xung đột biểu quyết cộng đồng (3 Duyệt vs 3 Từ chối)',
    priority: 'Cao',
    status: 'Đang xem xét',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    anomalyType: 'conflict',
    location: 'Số 124 Nguyễn Thái Học, Ba Đình, Hà Nội',
    surveyorName: 'Trần Hoàng Long',
    aiConfidence: 96.4,
    cropImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 1.8,
  },
  {
    id: '#RC-8925-B',
    name: 'P.103a - Cấm xe ô tô',
    reportedDate: '23/10/2026',
    reason: 'Độ tin cậy AI dưới ngưỡng (YOLO 68% - CLIP 71%)',
    priority: 'Cao',
    status: 'Chưa xử lý',
    signCode: 'P.103a',
    signName: 'Cấm xe ô tô',
    anomalyType: 'low_conf',
    location: 'Ngã tư Lê Duẩn - Hai Bà Trưng, Quận 1, TP.HCM',
    surveyorName: 'Nguyễn Văn Hùng',
    aiConfidence: 68.0,
    cropImageUrl: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 2.3,
  },
  {
    id: '#RC-8926-C',
    name: 'W.201a - Chỗ ngoặt nguy hiểm vòng bên trái',
    reportedDate: '22/10/2026',
    reason: 'Lệch tọa độ GPS so với bản đồ OSM (> 18m)',
    priority: 'Vừa',
    status: 'Chưa xử lý',
    signCode: 'W.201a',
    signName: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    anomalyType: 'gps_offset',
    location: 'Km 18+200 Quốc lộ 1A, Đà Nẵng',
    surveyorName: 'Lê Hoàng Nam',
    aiConfidence: 84.5,
    cropImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 18.4,
  },
  {
    id: '#RC-8927-D',
    name: 'P.106a - Cấm xe tải',
    reportedDate: '21/10/2026',
    reason: 'Ảnh chụp bị mờ do tốc độ xe và ngược sáng',
    priority: 'Vừa',
    status: 'Đang xem xét',
    signCode: 'P.106a',
    signName: 'Cấm xe tải',
    anomalyType: 'blur',
    location: 'Số 88 Võ Thị Sáu, Quận 3, TP.HCM',
    surveyorName: 'Phạm Hồng Phúc',
    aiConfidence: 72.1,
    cropImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 3.1,
  },
  {
    id: '#RC-8928-E',
    name: 'P.123a - Cấm rẽ trái',
    reportedDate: '20/10/2026',
    reason: 'Xung đột nhãn dự đoán giữa YOLO12 và nhãn gán tài xế',
    priority: 'Thấp',
    status: 'Chưa xử lý',
    signCode: 'P.123a',
    signName: 'Cấm rẽ trái',
    anomalyType: 'conflict',
    location: 'Đường Trần Phú, Quận Hải Châu, Đà Nẵng',
    surveyorName: 'Trần Văn Minh',
    aiConfidence: 79.8,
    cropImageUrl: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 0.9,
  },
  {
    id: '#RC-8929-F',
    name: 'I.401 - Bắt đầu đường ưu tiên',
    reportedDate: '19/10/2026',
    reason: 'Đã hoàn tất hiệu chỉnh nhãn và phê duyệt vị trí',
    priority: 'Thấp',
    status: 'Đã giải quyết',
    signCode: 'I.401',
    signName: 'Bắt đầu đường ưu tiên',
    anomalyType: 'conflict',
    location: 'Đường Hoàng Diệu, Ba Đình, Hà Nội',
    surveyorName: 'Hoàng Nhật Nam',
    aiConfidence: 98.2,
    cropImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 0.4,
  },
  {
    id: '#RC-8930-G',
    name: 'P.127 - Tốc độ tối đa cho phép (50 km/h)',
    reportedDate: '18/10/2026',
    reason: 'Biển báo bị nghiêng và cành cây che khuất một phần',
    priority: 'Cao',
    status: 'Chưa xử lý',
    signCode: 'P.127',
    signName: 'Tốc độ tối đa cho phép (50 km/h)',
    anomalyType: 'blur',
    location: 'Đường Đồng Khởi, Bến Nghé, Quận 1, TP.HCM',
    surveyorName: 'Lê Thu Trang',
    aiConfidence: 64.3,
    cropImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 1.4,
  },
  {
    id: '#RC-8931-H',
    name: 'W.224 - Người đi bộ qua đường',
    reportedDate: '17/10/2026',
    reason: 'Cộng đồng báo cáo biển mới cắm chưa có trong OSM',
    priority: 'Vừa',
    status: 'Đang xem xét',
    signCode: 'W.224',
    signName: 'Người đi bộ qua đường',
    anomalyType: 'gps_offset',
    location: 'Số 165 Cầu Giấy, Quận Cầu Giấy, Hà Nội',
    surveyorName: 'Vũ Đức Thịnh',
    aiConfidence: 89.1,
    cropImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
    gpsOffset: 4.8,
  },
]

export const mockCandidateDetail: CandidateDetailData = {
  id: 'RC-8924-A',
  predictedLabel: 'P.102 - Cấm đi ngược chiều',
  yoloConfidence: 96.4,
  clipConfidence: 88.5,
  lat: 10.7769,
  lng: 106.7009,
  heading: 180,
  consensusApprove: 3,
  consensusReject: 3,
  cropImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  cropImageHdUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200',
  cropFileName: 'crop_best_frame_482.png',
  contextImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
  contextImageHdUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
  contextFileName: 'dashcam_raw_frame_1042.jpg',
  surveyor: {
    name: 'Trần Hoàng Long',
    initials: 'TH',
    levelKey: 'lbl_surveyor_level',
    trustScore: 92.4,
    totalRuns: 148,
    accuracyRate: 96.8,
  },
  auditLogs: [
    { id: '1', logKey: 'log_ingested', time: '14:20 24/10', actor: 'Celery Worker' },
    { id: '2', logKey: 'log_flagged', time: '14:22 24/10', actor: 'Consensus Engine (3 vs 3)' },
    { id: '3', logKey: 'log_inspecting', time: 'log_now', actor: 'Staff' },
  ],
}
