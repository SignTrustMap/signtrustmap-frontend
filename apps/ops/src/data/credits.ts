export interface CreditApprovalItem {
  id: string
  user: {
    name: string
    email: string
    avatarBg: string
  }
  activityType: 'Khảo sát thực địa' | 'Kiểm duyệt cộng đồng' | 'Tái xác thực biển báo' | 'Nhiệm vụ hàng ngày'
  amount: number
  riskLevel: 'Thấp' | 'Nghi vấn' | 'Cảnh báo gian lận'
  evidenceSummary: string
  createdAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export const mockCreditApprovals: CreditApprovalItem[] = [
  {
    id: 'CRD-1082',
    user: { name: 'Trần Văn Minh', email: 'minh.tv@gmail.com', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    activityType: 'Khảo sát thực địa',
    amount: 150,
    riskLevel: 'Thấp',
    evidenceSummary: 'Video hành trình 3.2km kèm file GPX hợp lệ (14 biển báo phát hiện)',
    createdAt: 'Hôm nay, 10:15 SA',
    status: 'Pending',
  },
  {
    id: 'CRD-1083',
    user: { name: 'Lê Hoàng Phát', email: 'phat.lh@gmail.com', avatarBg: 'bg-[#fee2e2] text-[#b91c1c]' },
    activityType: 'Kiểm duyệt cộng đồng',
    amount: 80,
    riskLevel: 'Cảnh báo gian lận',
    evidenceSummary: 'Tỷ lệ đồng thuận bất thường (Bỏ phiếu quá nhanh < 1s/biển báo)',
    createdAt: 'Hôm nay, 09:40 SA',
    status: 'Pending',
  },
  {
    id: 'CRD-1084',
    user: { name: 'Nguyễn Thị Hoa', email: 'hoa.nt@gmail.com', avatarBg: 'bg-[#dcfce7] text-[#15803d]' },
    activityType: 'Tái xác thực biển báo',
    amount: 50,
    riskLevel: 'Thấp',
    evidenceSummary: 'Ảnh chụp biển P.102 mới thay thế tại Quận 3',
    createdAt: 'Hôm qua, 16:30 CH',
    status: 'Pending',
  },
]
