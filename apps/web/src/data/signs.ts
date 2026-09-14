export interface SignItem {
  id: string
  code: string
  name: string
  category: 'P' | 'R' | 'W' | 'I' | 'S'
  lat: number
  lng: number
  heading: number
  trustScore: number
  status: 'verified' | 'pending' | 'revalidating'
  location: string
  verifiedAt: string
  imageUrl?: string
  description?: string
}

export interface SignCategory {
  id: string
  label: string
  color: string
  bgHex: string
}

export const signCategories: SignCategory[] = [
  { id: 'ALL', label: 'Tất cả', color: '#ffffff', bgHex: '#00c4de' },
  { id: 'P', label: 'Biển Cấm', color: '#ef4444', bgHex: '#ef4444' },
  { id: 'R', label: 'Biển Hiệu Lệnh', color: '#007b8b', bgHex: '#007b8b' },
  { id: 'W', label: 'Biển Cảnh Báo', color: '#f59e0b', bgHex: '#f59e0b' },
  { id: 'I', label: 'Biển Chỉ Dẫn', color: '#00c4de', bgHex: '#00c4de' },
  { id: 'S', label: 'Biển Phụ', color: '#6b7280', bgHex: '#6b7280' },
]

export const mockSigns: SignItem[] = [
  {
    id: 'sgn-01',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    category: 'P',
    lat: 10.7769,
    lng: 106.7009,
    heading: 180,
    trustScore: 99.4,
    status: 'verified',
    location: 'Đường Nguyễn Huệ, Quận 1, TP.HCM',
    verifiedAt: '12/08/2026',
    description: 'Biển báo đặt tại đầu tuyến đường, áp dụng cho tất cả các loại phương tiện cơ giới và thô sơ.',
  },
  {
    id: 'sgn-02',
    code: 'P.127',
    name: 'Tốc độ tối đa cho phép 50 km/h',
    category: 'P',
    lat: 10.7725,
    lng: 106.698,
    heading: 90,
    trustScore: 98.7,
    status: 'verified',
    location: 'Đường Lê Lợi, Quận 1, TP.HCM',
    verifiedAt: '15/08/2026',
    description: 'Giới hạn tốc độ tối đa 50 km/h trong khu vực đông dân cư theo quy chuẩn QCVN 41:2019.',
  },
  {
    id: 'sgn-03',
    code: 'R.301a',
    name: 'Hướng đi phải theo - Đi thẳng',
    category: 'R',
    lat: 10.7798,
    lng: 106.6995,
    heading: 0,
    trustScore: 97.5,
    status: 'verified',
    location: 'Giao lộ Đồng Khởi - Lê Thánh Tôn, Quận 1, TP.HCM',
    verifiedAt: '18/08/2026',
    description: 'Bắt buộc các phương tiện chỉ được phép đi thẳng, không được rẽ trái hay rẽ phải.',
  },
  {
    id: 'sgn-04',
    code: 'W.201a',
    name: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    category: 'W',
    lat: 10.783,
    lng: 106.704,
    heading: 270,
    trustScore: 96.1,
    status: 'verified',
    location: 'Đường Tôn Đức Thắng, Quận 1, TP.HCM',
    verifiedAt: '20/08/2026',
    description: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm có bán kính cong nhỏ sang phía bên trái.',
  },
  {
    id: 'sgn-05',
    code: 'I.407a',
    name: 'Đường một chiều',
    category: 'I',
    lat: 10.775,
    lng: 106.705,
    heading: 135,
    trustScore: 99.0,
    status: 'verified',
    location: 'Đường Hàm Nghi, Quận 1, TP.HCM',
    verifiedAt: '22/08/2026',
    description: 'Chỉ dẫn những đoạn đường chỉ cho phép phương tiện lưu thông theo một chiều nhất định.',
  },
  {
    id: 'sgn-06',
    code: 'P.130',
    name: 'Cấm dừng xe và đỗ xe',
    category: 'P',
    lat: 10.7712,
    lng: 106.7035,
    heading: 45,
    trustScore: 99.2,
    status: 'verified',
    location: 'Đường Pasteur, Quận 1, TP.HCM',
    verifiedAt: '24/08/2026',
    description: 'Cấm các loại xe cơ giới dừng và đỗ ở đoạn đường có đặt biển báo.',
  },
  {
    id: 'sgn-07',
    code: 'R.302b',
    name: 'Hướng phải đi vòng sang phải',
    category: 'R',
    lat: 10.7745,
    lng: 106.692,
    heading: 315,
    trustScore: 98.1,
    status: 'verified',
    location: 'Vòng xoay Ngã Sáu Phù Đổng, Quận 1, TP.HCM',
    verifiedAt: '25/08/2026',
    description: 'Báo cho các loại xe phải đi vòng qua chướng ngại vật theo hướng mũi tên chỉ sang phải.',
  },
]
