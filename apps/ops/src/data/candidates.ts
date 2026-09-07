export type CandidateStatus = 'Chưa xử lý' | 'Đang xem xét' | 'Đã giải quyết'
export type PriorityLevel = 'Cao' | 'Vừa' | 'Thấp'

export interface CandidateItem {
  id: string
  name: string
  reportedDate: string
  reason: string
  priority: PriorityLevel
  status: CandidateStatus
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
    name: 'Jonathan Doe (CD-99012-XT)',
    reportedDate: '24/10/2023',
    reason: 'Nghi vấn sai lệch tài liệu xử lý vật chất nguy hiểm',
    priority: 'Cao',
    status: 'Đang xem xét',
  },
  {
    id: '#RC-8925-B',
    name: 'Maria Garcia (CD-44210-VN)',
    reportedDate: '23/10/2023',
    reason: 'Phát hiện sự không nhất quán trong nhật ký GPS hành trình',
    priority: 'Vừa',
    status: 'Chưa xử lý',
  },
  {
    id: '#RC-8926-C',
    name: 'Liam Smith (CD-10294-UK)',
    reportedDate: '22/10/2023',
    reason: 'Thời hạn hiệu lực chứng chỉ hành nghề đã hết hạn',
    priority: 'Thấp',
    status: 'Đã giải quyết',
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
