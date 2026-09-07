export interface CatalogEntry {
  id: string
  code: string
  name: string
  category: 'prohibition' | 'warning' | 'mandatory' | 'information'
  shape: string
  color: string
  description: string
  guidelines: string
  aiPrompt: string
  osmMapping: string
  status: 'Active' | 'Deprecated' | 'Draft'
  version: string
}

export interface MissingSignTypeReport {
  id: string
  tempLabel: string
  category: string
  sampleImageUrl: string
  reportedBy: string
  reportedAt: string
  lat: number
  lng: number
  reporterNote: string
  similarCatalogEntries: string[]
  status: 'Open' | 'Approved' | 'Rejected' | 'Merged'
}

export interface AvailableSignOption {
  code: string
  nameKey: string
  codeTitle: string
}

export const availableCatalogSigns: AvailableSignOption[] = [
  { code: 'P.102', nameKey: 'cat_prohibition', codeTitle: 'P.102 - Cấm đi ngược chiều' },
  { code: 'P.103a', nameKey: 'cat_prohibition', codeTitle: 'P.103a - Cấm ô tô' },
  { code: 'P.127', nameKey: 'cat_prohibition', codeTitle: 'P.127 - Tốc độ tối đa cho phép (50 km/h)' },
  { code: 'R.301a', nameKey: 'cat_mandatory', codeTitle: 'R.301a - Hướng đi phải theo (Đi thẳng)' },
  { code: 'R.302a', nameKey: 'cat_mandatory', codeTitle: 'R.302a - Hướng phải đi vòng chướng ngại vật' },
  { code: 'W.201a', nameKey: 'cat_warning', codeTitle: 'W.201a - Chỗ ngoặt nguy hiểm vòng bên trái' },
  { code: 'W.207a', nameKey: 'cat_warning', codeTitle: 'W.207a - Giao nhau với đường không ưu tiên' },
  { code: 'I.401', nameKey: 'cat_information', codeTitle: 'I.401 - Bắt đầu đường ưu tiên' },
]

export const mockCatalogData: CatalogEntry[] = [
  {
    id: 'CAT-P102',
    code: 'P.102',
    name: 'Cấm đi ngược chiều (No Entry)',
    category: 'prohibition',
    shape: 'Circle',
    color: 'Red background, white horizontal bar',
    description: 'Biển báo cấm các loại xe cơ giới và thô sơ đi vào theo chiều đặt biển.',
    guidelines: 'Bắt trọn viền tròn đỏ ngoài cùng, không cắt góc viền.',
    aiPrompt: 'Circular red traffic sign with a horizontal white bar in center indicating no entry',
    osmMapping: 'oneway=yes, access:backward=no',
    status: 'Active',
    version: 'v2.4',
  },
  {
    id: 'CAT-P127',
    code: 'P.127',
    name: 'Tốc độ tối đa cho phép 50km/h',
    category: 'prohibition',
    shape: 'Circle',
    color: 'White background, red border, black number 50',
    description: 'Biển báo tốc độ tối đa cho phép các xe chạy không quá 50 km/h.',
    guidelines: 'Đảm bảo chữ số 50 ở giữa đọc rõ ràng, không bị chói sáng.',
    aiPrompt: 'Circular white sign with red border displaying black number 50 for max speed',
    osmMapping: 'maxspeed=50',
    status: 'Active',
    version: 'v2.4',
  },
  {
    id: 'CAT-W207a',
    code: 'W.207a',
    name: 'Giao nhau với đường không ưu tiên',
    category: 'warning',
    shape: 'Triangle',
    color: 'Yellow background, red border, black cross symbol',
    description: 'Báo trước sắp đến nơi giao nhau với đường không ưu tiên.',
    guidelines: 'Tam giác đều viền đỏ hướng lên trên.',
    aiPrompt: 'Triangular yellow warning sign with thick black arrow intersected by thinner line',
    osmMapping: 'highway=give_way',
    status: 'Active',
    version: 'v2.4',
  },
]

export const mockMissingSignTypeReports: MissingSignTypeReport[] = [
  {
    id: 'REP-MISS-01',
    tempLabel: 'Khu vực giới hạn xe máy điện (EV Scooter Only)',
    category: 'prohibition',
    sampleImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&q=80',
    reportedBy: 'Reviewer #14',
    reportedAt: '2026-08-30 14:15',
    lat: 10.7712,
    lng: 106.7205,
    reporterNote: 'Biển báo mới lắp đặt thí điểm tại khu đô thị Thủ Thiêm, viền xanh có biểu tượng pin.',
    similarCatalogEntries: ['P.104', 'P.111a'],
    status: 'Open',
  },
  {
    id: 'REP-MISS-02',
    tempLabel: 'Làn đường cho xe đạp công cộng',
    category: 'mandatory',
    sampleImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&q=80',
    reportedBy: 'Surveyor #89',
    reportedAt: '2026-08-29 09:20',
    lat: 10.7745,
    lng: 106.6982,
    reporterNote: 'Biển vuông màu xanh biểu tượng người đạp xe kèm logo TNGo.',
    similarCatalogEntries: ['R.403a', 'R.404a'],
    status: 'Open',
  },
]
