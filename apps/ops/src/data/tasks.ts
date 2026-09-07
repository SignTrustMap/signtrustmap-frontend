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
  },
]
