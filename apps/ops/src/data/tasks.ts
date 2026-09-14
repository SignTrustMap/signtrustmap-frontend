export interface RevalidationTask {
  id: string
  signCode: string
  signName: string
  location: string
  lastVerifiedDate: string
  freshnessStatus: 'Stale' | 'Critical' | 'Pending Evidence'
  rewardCredits: number
  submittedEvidenceCount: number
  assignedSurveyor?: string
  gpsOffset?: number
  fieldNotes?: string
  submittedAt?: string
  origImageUrl?: string
  newImageUrl?: string
}

export const mockRevalidationTasks: RevalidationTask[] = [
  {
    id: 'TSK-9021',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    location: 'Số 124 Nguyễn Thái Học, Ba Đình, Hà Nội',
    lastVerifiedDate: '15/04/2023 (Quá hạn 16 tháng)',
    freshnessStatus: 'Critical',
    rewardCredits: 50,
    submittedEvidenceCount: 2,
    assignedSurveyor: 'Nguyễn Văn Hùng',
    gpsOffset: 1.8,
    fieldNotes: 'Biển báo vẫn còn nguyên vẹn, mặt phản quang tốt, không bị che khuất.',
    submittedAt: '15 phút trước',
    origImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    newImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9022',
    signCode: 'P.130',
    signName: 'Cấm dừng xe và đỗ xe',
    location: 'Ngã tư Lê Duẩn - Hai Bà Trưng, Quận 1, TP.HCM',
    lastVerifiedDate: '10/08/2023 (Quá hạn 12 tháng)',
    freshnessStatus: 'Stale',
    rewardCredits: 35,
    submittedEvidenceCount: 1,
    assignedSurveyor: 'Phạm Hồng Phúc',
    gpsOffset: 0.9,
    fieldNotes: 'Biển sơn mới, tầm nhìn thông thoáng từ khoảng cách 40m.',
    submittedAt: '1 giờ trước',
    origImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    newImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9023',
    signCode: 'W.207a',
    signName: 'Giao nhau với đường không ưu tiên',
    location: 'Km 18+200 Quốc lộ 1A, Đà Nẵng',
    lastVerifiedDate: '01/06/2023 (Quá hạn 14 tháng)',
    freshnessStatus: 'Pending Evidence',
    rewardCredits: 40,
    submittedEvidenceCount: 3,
    assignedSurveyor: 'Lê Hoàng Nam',
    gpsOffset: 2.1,
    fieldNotes: 'Có tán cây nhỏ che một phần góc trên bên phải, cần cắt tỉa nhẹ.',
    submittedAt: '35 phút trước',
    origImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    newImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9024',
    signCode: 'P.127',
    signName: 'Tốc độ tối đa cho phép (50 km/h)',
    location: 'Số 88 Võ Thị Sáu, Quận 3, TP.HCM',
    lastVerifiedDate: '12/02/2023 (Quá hạn 18 tháng)',
    freshnessStatus: 'Critical',
    rewardCredits: 60,
    submittedEvidenceCount: 2,
    assignedSurveyor: 'Trần Văn Minh',
    gpsOffset: 1.1,
    fieldNotes: 'Mặt biển rõ nét, vị trí lắp đặt đúng tim đường OSM.',
    submittedAt: '2 giờ trước',
    origImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    newImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9025',
    signCode: 'R.301a',
    signName: 'Hướng đi phải theo (Đi thẳng)',
    location: 'Đường Trần Phú, Quận Hải Châu, Đà Nẵng',
    lastVerifiedDate: '20/10/2023 (Quá hạn 10 tháng)',
    freshnessStatus: 'Stale',
    rewardCredits: 35,
    submittedEvidenceCount: 0,
    origImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9026',
    signCode: 'I.401',
    signName: 'Bắt đầu đường ưu tiên',
    location: 'Đường Hoàng Diệu, Quận Ba Đình, Hà Nội',
    lastVerifiedDate: '05/11/2022 (Quá hạn 21 tháng)',
    freshnessStatus: 'Critical',
    rewardCredits: 75,
    submittedEvidenceCount: 1,
    assignedSurveyor: 'Hoàng Nhật Nam',
    gpsOffset: 0.7,
    fieldNotes: 'Biển mới tinh, vừa được Sở GTVT lắp mới thay thế biển cũ.',
    submittedAt: '45 phút trước',
    origImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    newImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9027',
    signCode: 'P.103a',
    signName: 'Cấm xe ô tô',
    location: 'Đường Đồng Khởi, Phường Bến Nghé, Quận 1, TP.HCM',
    lastVerifiedDate: '18/09/2023 (Quá hạn 11 tháng)',
    freshnessStatus: 'Pending Evidence',
    rewardCredits: 45,
    submittedEvidenceCount: 2,
    assignedSurveyor: 'Lê Thu Trang',
    gpsOffset: 1.4,
    fieldNotes: 'Biển cấm ô tô theo giờ, gắn phụ biển S.508 bên dưới.',
    submittedAt: '10 phút trước',
    origImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    newImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'TSK-9028',
    signCode: 'W.224',
    signName: 'Người đi bộ qua đường',
    location: 'Số 165 Cầu Giấy, Quận Cầu Giấy, Hà Nội',
    lastVerifiedDate: '30/11/2023 (Quá hạn 9 tháng)',
    freshnessStatus: 'Stale',
    rewardCredits: 30,
    submittedEvidenceCount: 0,
    origImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
  },
]

