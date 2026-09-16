export interface RevalidationTaskItem {
  id: string
  code: string
  name: string
  roadName: string
  category: string
  priority: 'Urgent' | 'High' | 'Normal'
  staleDays: number
  lat: number
  lng: number
  historicalCropUrl: string
  historicalContextUrl: string
  lastVerifiedDate: string
  currentTrustScore: number
  reason: string
  rewardCredits: number
  status?: 'Pending' | 'Submitted' | 'Approved' | 'Rejected'
}

export const mockRevalidationTasks: RevalidationTaskItem[] = [
  {
    id: 'reval-001',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    roadName: 'Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    category: 'P',
    priority: 'Urgent',
    staleDays: 95,
    lat: 10.7769,
    lng: 106.7009,
    historicalCropUrl: 'https://images.unsplash.com/photo-1572733957971-e945c78673fb?w=600&auto=format&fit=crop&q=60',
    historicalContextUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=60',
    lastVerifiedDate: '2025-12-10',
    currentTrustScore: 62,
    reason: 'Đã quá hạn 90 ngày và có 2 tài xế báo cáo bị che khuất bởi nhánh cây.',
    rewardCredits: 45,
    status: 'Pending',
  },
  {
    id: 'reval-002',
    code: 'P.130',
    name: 'Cấm quay đầu xe',
    roadName: 'Đường Lê Lợi giao Pasteur, Quận 1, TP. Hồ Chí Minh',
    category: 'P',
    priority: 'High',
    staleDays: 74,
    lat: 10.7735,
    lng: 106.699,
    historicalCropUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=60',
    historicalContextUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=60',
    lastVerifiedDate: '2026-01-02',
    currentTrustScore: 71,
    reason: 'Chu kỳ kiểm định định kỳ (70+ ngày), khu vực thi công tuyến metro hoàn trả mặt đường.',
    rewardCredits: 35,
    status: 'Pending',
  },
  {
    id: 'reval-003',
    code: 'W.207a',
    name: 'Giao nhau với đường không ưu tiên',
    roadName: 'Đại lộ Võ Văn Kiệt, Quận 5, TP. Hồ Chí Minh',
    category: 'W',
    priority: 'Normal',
    staleDays: 62,
    lat: 10.7554,
    lng: 106.6781,
    historicalCropUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=60',
    historicalContextUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=600&auto=format&fit=crop&q=60',
    lastVerifiedDate: '2026-01-14',
    currentTrustScore: 84,
    reason: 'Kiểm tra định kỳ 60 ngày để duy trì Trust Score trên 80%.',
    rewardCredits: 25,
    status: 'Pending',
  },
  {
    id: 'reval-004',
    code: 'R.301a',
    name: 'Hướng đi phải theo (Đi thẳng)',
    roadName: 'Đường Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh',
    category: 'R',
    priority: 'Urgent',
    staleDays: 102,
    lat: 10.7981,
    lng: 106.7145,
    historicalCropUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=600&auto=format&fit=crop&q=60',
    historicalContextUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&auto=format&fit=crop&q=60',
    lastVerifiedDate: '2025-12-03',
    currentTrustScore: 54,
    reason: 'Tài xế báo cáo biển bị mờ phản quang vào ban đêm, cần khảo sát lại góc chụp mới.',
    rewardCredits: 50,
    status: 'Pending',
  },
  {
    id: 'reval-005',
    code: 'I.401',
    name: 'Bắt đầu đường ưu tiên',
    roadName: 'Đường Phạm Văn Đồng, TP. Thủ Đức, TP. Hồ Chí Minh',
    category: 'I',
    priority: 'Normal',
    staleDays: 65,
    lat: 10.8242,
    lng: 106.7214,
    historicalCropUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60',
    historicalContextUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&auto=format&fit=crop&q=60',
    lastVerifiedDate: '2026-01-11',
    currentTrustScore: 88,
    reason: 'Chu kỳ định kỳ duy trì chất lượng bản đồ.',
    rewardCredits: 20,
    status: 'Pending',
  },
]
