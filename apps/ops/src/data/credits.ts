export type ContributorRole = 'surveyor' | 'reviewer' | 'contributor' | 'driver'

export interface CreditApprovalItem {
  id: string
  user: {
    name: string
    email: string
    avatarBg: string
    role: ContributorRole
  }
  activityType: 'Khảo sát thực địa' | 'Kiểm duyệt cộng đồng' | 'Tái xác thực biển báo' | 'Nhiệm vụ hàng ngày'
  activityKey: 'survey' | 'review' | 'revalidation' | 'daily'
  amount: number
  riskLevel: 'Thấp' | 'Nghi vấn' | 'Cảnh báo gian lận'
  evidenceSummary: string
  createdAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
  evidenceUrl?: string
  riskScore?: number
  riskReason?: string
  deviceModel?: string
  gpsDistance?: number
  payoutMethod?: string
  reviewedBy?: string
  reviewedAt?: string
}

export const mockCreditApprovals: CreditApprovalItem[] = [
  {
    id: 'CRD-1082',
    user: {
      name: 'Trần Văn Minh',
      email: 'minh.tv@gmail.com',
      avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]',
      role: 'surveyor',
    },
    activityType: 'Khảo sát thực địa',
    activityKey: 'survey',
    amount: 150,
    riskLevel: 'Thấp',
    riskScore: 8,
    evidenceSummary: 'Video hành trình 3.2km kèm file GPX hợp lệ (14 biển báo phát hiện)',
    evidenceUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'Dashcam 70mai A810 4K',
    gpsDistance: 2.1,
    payoutMethod: 'Ví MoMo (0912.***.678)',
    createdAt: 'Hôm nay, 10:15 SA',
    status: 'Pending',
  },
  {
    id: 'CRD-1083',
    user: {
      name: 'Lê Hoàng Phát',
      email: 'phat.lh@gmail.com',
      avatarBg: 'bg-[#fee2e2] text-[#b91c1c]',
      role: 'reviewer',
    },
    activityType: 'Kiểm duyệt cộng đồng',
    activityKey: 'review',
    amount: 80,
    riskLevel: 'Cảnh báo gian lận',
    riskScore: 92,
    riskReason: 'Tốc độ biểu quyết trung bình 0.4s/biển, tỷ lệ Approve 100% không qua kiểm tra ảnh.',
    evidenceSummary: 'Tỷ lệ đồng thuận bất thường (Bỏ phiếu quá nhanh < 1s/biển báo)',
    evidenceUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'Web Browser / Chrome 124 (Emulated Script)',
    payoutMethod: 'Ví ZaloPay (0983.***.233)',
    createdAt: 'Hôm nay, 09:40 SA',
    status: 'Pending',
  },
  {
    id: 'CRD-1084',
    user: {
      name: 'Nguyễn Thị Hoa',
      email: 'hoa.nt@gmail.com',
      avatarBg: 'bg-[#dcfce7] text-[#15803d]',
      role: 'contributor',
    },
    activityType: 'Tái xác thực biển báo',
    activityKey: 'revalidation',
    amount: 50,
    riskLevel: 'Thấp',
    riskScore: 5,
    evidenceSummary: 'Ảnh chụp biển P.102 mới thay thế tại góc đường Pasteur - Lê Lợi Quận 1',
    evidenceUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'iPhone 15 Pro Max',
    gpsDistance: 1.4,
    payoutMethod: 'Tài khoản Vietcombank (***8921)',
    createdAt: 'Hôm qua, 16:30 CH',
    status: 'Pending',
  },
  {
    id: 'CRD-1085',
    user: {
      name: 'Phạm Quốc Hùng',
      email: 'hung.pq@grab.com',
      avatarBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
      role: 'driver',
    },
    activityType: 'Khảo sát thực địa',
    activityKey: 'survey',
    amount: 200,
    riskLevel: 'Thấp',
    riskScore: 12,
    evidenceSummary: 'Thu thập chuỗi hình ảnh liên tục 8.5km dọc tuyến Vành Đai 3 Hà Nội',
    evidenceUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    gpsDistance: 3.5,
    payoutMethod: 'Ví Grab Driver Wallet',
    createdAt: 'Hôm qua, 14:10 CH',
    status: 'Approved',
    reviewedBy: 'Trần Hoàng Long',
    reviewedAt: 'Hôm qua, 15:00 CH',
  },
  {
    id: 'CRD-1086',
    user: {
      name: 'Đặng Tuấn Anh',
      email: 'anh.dt@yahoo.com',
      avatarBg: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
      role: 'surveyor',
    },
    activityType: 'Khảo sát thực địa',
    activityKey: 'survey',
    amount: 120,
    riskLevel: 'Nghi vấn',
    riskScore: 68,
    riskReason: 'Độ lệch tọa độ GPS EXIF trên ảnh cách xa vị trí tim đường 120m.',
    evidenceSummary: 'Hình ảnh trích xuất từ camera có tọa độ GPS bị gián đoạn giữa hầm ngầm Thủ Thiêm',
    evidenceUrl: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'Xiaomi Redmi Note 13',
    gpsDistance: 120.4,
    payoutMethod: 'Ví Viettel Money (0935.***.112)',
    createdAt: '23/10/2026, 11:25 SA',
    status: 'Pending',
  },
  {
    id: 'CRD-1087',
    user: {
      name: 'Bùi Lan Anh',
      email: 'lananh.bui@gmail.com',
      avatarBg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
      role: 'reviewer',
    },
    activityType: 'Kiểm duyệt cộng đồng',
    activityKey: 'review',
    amount: 45,
    riskLevel: 'Thấp',
    riskScore: 6,
    evidenceSummary: 'Hoàn thành 30 lượt biểu quyết kiểm duyệt độ chính xác nhãn biển báo P.103a',
    evidenceUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'iPad Pro 11 M2',
    payoutMethod: 'Tài khoản MB Bank (***6688)',
    createdAt: '22/10/2026, 18:05 CH',
    status: 'Approved',
    reviewedBy: 'Lê Thu Trang',
    reviewedAt: '22/10/2026, 19:30 CH',
  },
  {
    id: 'CRD-1088',
    user: {
      name: 'Vũ Mạnh Cường',
      email: 'cuong.vm@botfarm.net',
      avatarBg: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
      role: 'contributor',
    },
    activityType: 'Nhiệm vụ hàng ngày',
    activityKey: 'daily',
    amount: 90,
    riskLevel: 'Cảnh báo gian lận',
    riskScore: 98,
    riskReason: 'Sử dụng hình ảnh trùng lặp tải từ Internet, chữ ký số máy ảnh không khớp EXIF thực tế.',
    evidenceSummary: 'Ảnh gửi lên trùng lặp 100% với ảnh đã có trên Google Maps Street View 2023',
    evidenceUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'Giả lập NoxPlayer / Android 9',
    payoutMethod: 'Tài khoản Techcombank (***4412)',
    createdAt: '21/10/2026, 08:30 SA',
    status: 'Rejected',
    reviewedBy: 'Trần Hoàng Long',
    reviewedAt: '21/10/2026, 09:15 SA',
  },
  {
    id: 'CRD-1089',
    user: {
      name: 'Đỗ Hữu Nghĩa',
      email: 'nghia.dh@be.com.vn',
      avatarBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-[#00c4de]',
      role: 'driver',
    },
    activityType: 'Khảo sát thực địa',
    activityKey: 'survey',
    amount: 110,
    riskLevel: 'Thấp',
    riskScore: 10,
    evidenceSummary: 'Khảo sát 4.6km tuyến Quốc lộ 1A Đà Nẵng, phát hiện biển W.207a bị cây che',
    evidenceUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    deviceModel: 'GoPro Hero 11 Black',
    gpsDistance: 1.8,
    payoutMethod: 'Ví bePay Wallet',
    createdAt: '20/10/2026, 15:40 CH',
    status: 'Approved',
    reviewedBy: 'Lê Hoàng Nam',
    reviewedAt: '20/10/2026, 16:20 CH',
  },
]

export interface TopupPackage {
  id: string
  name: string
  priceVnd: number
  credits: number
  bonus: number
  popular?: boolean
}

export interface EconomyPolicyRules {
  surveyReward: number
  reviewReward: number
  revalidationBounty: number
  dailyTaskBonus: number
  navConsumptionRate: number
  minNavBalance: number
  baseRateVndPerPoint: number
}

export const defaultEconomyPolicy: EconomyPolicyRules = {
  surveyReward: 50,
  reviewReward: 15,
  revalidationBounty: 35,
  dailyTaskBonus: 25,
  navConsumptionRate: 5,
  minNavBalance: 10,
  baseRateVndPerPoint: 100,
}

export const mockTopupPackages: TopupPackage[] = [
  { id: 'PKG-01', name: 'Gói Khởi đầu (Starter)', priceVnd: 50000, credits: 500, bonus: 50 },
  { id: 'PKG-02', name: 'Gói Tiêu chuẩn (Standard)', priceVnd: 100000, credits: 1000, bonus: 150, popular: true },
  { id: 'PKG-03', name: 'Gói Chuyên nghiệp (Pro)', priceVnd: 200000, credits: 2000, bonus: 400 },
  { id: 'PKG-04', name: 'Gói Doanh nghiệp (Fleet & Enterprise)', priceVnd: 500000, credits: 5000, bonus: 1200 },
]

