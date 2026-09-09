export type CatalogCategory =
  | 'prohibitory'
  | 'warning'
  | 'mandatory'
  | 'guide'
  | 'speed_limit'
  | 'additional'

export interface CatalogEntry {
  id: string
  code: string
  name: string
  nameVi: string
  nameEn: string
  category: CatalogCategory
  shape: 'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'
  color: 'Red-White' | 'Yellow-Black' | 'Blue-White' | 'Green-White' | 'Black-White' | string
  description: string
  descriptionVi: string
  descriptionEn: string
  guidelines?: string
  aiPrompt: string
  clipPrompt?: string
  osmMapping: string
  standardRef?: string
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
  { code: 'P.102', nameKey: 'cat_prohibitory', codeTitle: 'P.102 - Cấm đi ngược chiều' },
  { code: 'P.103a', nameKey: 'cat_prohibitory', codeTitle: 'P.103a - Cấm ô tô' },
  { code: 'P.127', nameKey: 'cat_speed_limit', codeTitle: 'P.127 - Tốc độ tối đa cho phép (60 km/h)' },
  { code: 'P.124a', nameKey: 'cat_prohibitory', codeTitle: 'P.124a - Cấm quay đầu xe' },
  { code: 'R.301a', nameKey: 'cat_mandatory', codeTitle: 'R.301a - Hướng đi phải theo (Đi thẳng)' },
  { code: 'R.302a', nameKey: 'cat_mandatory', codeTitle: 'R.302a - Hướng phải đi vòng chướng ngại vật' },
  { code: 'W.201a', nameKey: 'cat_warning', codeTitle: 'W.201a - Chỗ ngoặt nguy hiểm vòng bên trái' },
  { code: 'W.205a', nameKey: 'cat_warning', codeTitle: 'W.205a - Đường giao nhau cùng mức' },
  { code: 'W.207a', nameKey: 'cat_warning', codeTitle: 'W.207a - Giao nhau với đường không ưu tiên' },
  { code: 'I.401', nameKey: 'cat_guide', codeTitle: 'I.401 - Bắt đầu đường ưu tiên' },
  { code: 'I.407a', nameKey: 'cat_guide', codeTitle: 'I.407a - Đường một chiều' },
  { code: 'S.501', nameKey: 'cat_additional', codeTitle: 'S.501 - Phạm vi tác dụng của biển' },
]

export const mockCatalogData: CatalogEntry[] = [
  {
    id: 'CAT-P102',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    nameVi: 'Cấm đi ngược chiều',
    nameEn: 'No Entry / Wrong Way',
    category: 'prohibitory',
    shape: 'Circle',
    color: 'Red-White',
    description: 'Biển báo đường cấm tất cả các loại xe đi vào theo chiều đặt biển, trừ các xe được ưu tiên theo quy định.',
    descriptionVi: 'Biển báo đường cấm tất cả các loại xe đi vào theo chiều đặt biển, trừ các xe được ưu tiên theo quy định.',
    descriptionEn: 'Prohibits all vehicles from entering in the direction where the sign is placed, except priority vehicles.',
    guidelines: 'Bắt trọn viền tròn đỏ ngoài cùng, không cắt góc viền.',
    aiPrompt: 'a red circular traffic sign with a horizontal white bar in the center indicating no entry',
    clipPrompt: 'a red circular traffic sign with a horizontal white bar in the center indicating no entry',
    osmMapping: 'oneway=yes; access:backward=no',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 15',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-P103a',
    code: 'P.103a',
    name: 'Cấm ô tô',
    nameVi: 'Cấm ô tô',
    nameEn: 'No Cars / No Automobiles',
    category: 'prohibitory',
    shape: 'Circle',
    color: 'Red-White',
    description: 'Báo đường cấm tất cả các loại xe cơ giới kể cả mô tô 3 bánh có thùng đi qua, trừ xe máy 2 bánh.',
    descriptionVi: 'Báo đường cấm tất cả các loại xe cơ giới kể cả mô tô 3 bánh có thùng đi qua, trừ xe máy 2 bánh.',
    descriptionEn: 'Prohibits all motor vehicles including 3-wheeled motorbikes, except 2-wheeled motorbikes.',
    guidelines: 'Đảm bảo biểu tượng ô tô màu đen rõ nét trên nền trắng viền đỏ.',
    aiPrompt: 'a circular prohibitory traffic sign with a red border and a black car silhouette inside',
    clipPrompt: 'a circular prohibitory traffic sign with a red border and a black car silhouette inside',
    osmMapping: 'motorcar=no; access=destination',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 16',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-P127',
    code: 'P.127',
    name: 'Tốc độ tối đa cho phép 60 km/h',
    nameVi: 'Tốc độ tối đa cho phép 60 km/h',
    nameEn: 'Maximum Speed Limit 60 km/h',
    category: 'speed_limit',
    shape: 'Circle',
    color: 'Red-White',
    description: 'Biển báo tốc độ tối đa cho phép các xe cơ giới chạy không quá 60 km/h.',
    descriptionVi: 'Biển báo tốc độ tối đa cho phép các xe cơ giới chạy không quá 60 km/h.',
    descriptionEn: 'Indicates the maximum permitted speed limit of 60 km/h for motor vehicles.',
    guidelines: 'Đảm bảo chữ số 60 ở giữa đọc rõ ràng, không bị chói sáng.',
    aiPrompt: 'a circular speed limit sign with a red border and the number 60 in black font on white background',
    clipPrompt: 'a circular speed limit sign with a red border and the number 60 in black font on white background',
    osmMapping: 'maxspeed=60; source:maxspeed=VN:urban',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 24',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-P124a',
    code: 'P.124a',
    name: 'Cấm quay đầu xe',
    nameVi: 'Cấm quay đầu xe',
    nameEn: 'No U-Turn',
    category: 'prohibitory',
    shape: 'Circle',
    color: 'Red-White',
    description: 'Biển báo cấm các loại xe quay đầu theo kiểu chữ U, trừ các xe được ưu tiên.',
    descriptionVi: 'Biển báo cấm các loại xe quay đầu theo kiểu chữ U, trừ các xe được ưu tiên.',
    descriptionEn: 'Prohibits all vehicles from making a U-turn, except emergency vehicles.',
    guidelines: 'Nhận diện mũi tên quay ngược màu đen bị gạch chéo đỏ.',
    aiPrompt: 'a circular traffic sign with red border and a black U-turn arrow crossed by a red diagonal slash',
    clipPrompt: 'a circular traffic sign with red border and a black U-turn arrow crossed by a red diagonal slash',
    osmMapping: 'restriction=no_u_turn',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 21',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-W201a',
    code: 'W.201a',
    name: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    nameVi: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    nameEn: 'Dangerous Curve to the Left',
    category: 'warning',
    shape: 'Triangle',
    color: 'Yellow-Black',
    description: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm vòng về phía bên trái.',
    descriptionVi: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm vòng về phía bên trái.',
    descriptionEn: 'Warns drivers of an approaching sharp or dangerous curve to the left.',
    guidelines: 'Tam giác đều viền đỏ hướng lên trên, mũi tên đen uốn cong sang trái.',
    aiPrompt: 'a yellow equilateral triangular warning sign with black border and a black arrow curving to the left',
    clipPrompt: 'a yellow equilateral triangular warning sign with black border and a black arrow curving to the left',
    osmMapping: 'hazard=dangerous_curve; direction=left',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 29',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-W205a',
    code: 'W.205a',
    name: 'Đường giao nhau cùng mức',
    nameVi: 'Đường giao nhau cùng mức',
    nameEn: 'Crossroads / Intersection Ahead',
    category: 'warning',
    shape: 'Triangle',
    color: 'Yellow-Black',
    description: 'Báo trước sắp đến nơi giao nhau cùng mức của các tuyến đường cùng cấp.',
    descriptionVi: 'Báo trước sắp đến nơi giao nhau cùng mức của các tuyến đường cùng cấp.',
    descriptionEn: 'Warns that an equal level road intersection is ahead.',
    guidelines: 'Tam giác vàng viền đen, chữ thập đen đối xứng.',
    aiPrompt: 'a triangular yellow warning sign with black cross symbol in center',
    clipPrompt: 'a triangular yellow warning sign with black cross symbol in center',
    osmMapping: 'highway=crossing; crossing=uncontrolled',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 33',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-W207a',
    code: 'W.207a',
    name: 'Giao nhau với đường không ưu tiên',
    nameVi: 'Giao nhau với đường không ưu tiên',
    nameEn: 'Side Road / Non-Priority Intersection',
    category: 'warning',
    shape: 'Triangle',
    color: 'Yellow-Black',
    description: 'Báo trước sắp đến nơi giao nhau với đường không ưu tiên.',
    descriptionVi: 'Báo trước sắp đến nơi giao nhau với đường không ưu tiên.',
    descriptionEn: 'Warns priority drivers of an upcoming intersection with a minor side road.',
    guidelines: 'Đường ưu tiên là nét đậm chính giữa, đường nhánh nét mảnh cắt ngang.',
    aiPrompt: 'Triangular yellow warning sign with thick black arrow intersected by thinner line',
    clipPrompt: 'Triangular yellow warning sign with thick black arrow intersected by thinner line',
    osmMapping: 'highway=give_way; priority=yes',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 34',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-R301a',
    code: 'R.301a',
    name: 'Hướng đi phải theo - Đi thẳng',
    nameVi: 'Hướng đi phải theo - Đi thẳng',
    nameEn: 'Mandatory Direction - Straight Only',
    category: 'mandatory',
    shape: 'Circle',
    color: 'Blue-White',
    description: 'Bắt buộc các loại xe chỉ được đi thẳng ở nơi đặt biển.',
    descriptionVi: 'Bắt buộc các loại xe chỉ được đi thẳng ở nơi đặt biển.',
    descriptionEn: 'Mandates vehicles to proceed straight ahead only at the intersection.',
    guidelines: 'Hình tròn nền xanh dương, mũi tên trắng chỉ thẳng lên trên.',
    aiPrompt: 'a round blue mandatory traffic sign with a straight white arrow pointing upwards',
    clipPrompt: 'a round blue mandatory traffic sign with a straight white arrow pointing upwards',
    osmMapping: 'turn:lanes=through; mandatory=straight',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 36',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-R302a',
    code: 'R.302a',
    name: 'Hướng phải đi vòng chướng ngại vật - Vòng sang phải',
    nameVi: 'Hướng phải đi vòng chướng ngại vật - Vòng sang phải',
    nameEn: 'Pass on Right Side of Obstacle',
    category: 'mandatory',
    shape: 'Circle',
    color: 'Blue-White',
    description: 'Báo cho các loại xe phải đi vòng sang phía bên phải để tránh chướng ngại vật.',
    descriptionVi: 'Báo cho các loại xe phải đi vòng sang phía bên phải để tránh chướng ngại vật.',
    descriptionEn: 'Instructs drivers to keep right to navigate around obstacles or islands.',
    guidelines: 'Hình tròn nền xanh dương, mũi tên trắng chéo xuống góc phải.',
    aiPrompt: 'a blue round mandatory sign with an arrow pointing down and to the right',
    clipPrompt: 'a blue round mandatory sign with an arrow pointing down and to the right',
    osmMapping: 'traffic_calming=island; keep_right=yes',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 37',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-I401',
    code: 'I.401',
    name: 'Bắt đầu đường ưu tiên',
    nameVi: 'Bắt đầu đường ưu tiên',
    nameEn: 'Priority Road Begins',
    category: 'guide',
    shape: 'Diamond',
    color: 'Yellow-Black',
    description: 'Biểu thị cho người tham gia giao thông biết bắt đầu đoạn đường được quyền ưu tiên.',
    descriptionVi: 'Biểu thị cho người tham gia giao thông biết bắt đầu đoạn đường được quyền ưu tiên.',
    descriptionEn: 'Indicates the beginning of a priority road where vehicles have right of way.',
    guidelines: 'Hình thoi vàng viền trắng dày đặt chéo góc.',
    aiPrompt: 'a diamond shaped sign with yellow center and white border indicating priority road',
    clipPrompt: 'a diamond shaped sign with yellow center and white border indicating priority road',
    osmMapping: 'priority_road=yes; highway=priority',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 42',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-I407a',
    code: 'I.407a',
    name: 'Đường một chiều',
    nameVi: 'Đường một chiều',
    nameEn: 'One-Way Street',
    category: 'guide',
    shape: 'Rectangle',
    color: 'Blue-White',
    description: 'Chỉ dẫn những đoạn đường chỉ cho phép xe chạy theo một chiều quy định.',
    descriptionVi: 'Chỉ dẫn những đoạn đường chỉ cho phép xe chạy theo một chiều quy định.',
    descriptionEn: 'Guides road users on streets where traffic flows only in one direction.',
    guidelines: 'Hình chữ nhật đứng nền xanh lam, mũi tên trắng to bản.',
    aiPrompt: 'a blue rectangular sign with a thick white arrow pointing upwards',
    clipPrompt: 'a blue rectangular sign with a thick white arrow pointing upwards',
    osmMapping: 'oneway=yes; traffic_sign=VN:I.407a',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 48',
    status: 'Active',
    version: 'v2.5',
  },
  {
    id: 'CAT-S501',
    code: 'S.501',
    name: 'Phạm vi tác dụng của biển',
    nameVi: 'Phạm vi tác dụng của biển',
    nameEn: 'Distance / Scope of Sign Effect',
    category: 'additional',
    shape: 'Rectangle',
    color: 'Black-White',
    description: 'Thông báo chiều dài đoạn đường nguy hiểm hoặc đoạn đường áp dụng hiệu lực của biển chính.',
    descriptionVi: 'Thông báo chiều dài đoạn đường nguy hiểm hoặc đoạn đường áp dụng hiệu lực của biển chính.',
    descriptionEn: 'Specifies the distance over which the main traffic regulation applies.',
    guidelines: 'Biển phụ chữ nhật nằm ngang màu trắng chữ đen kèm mũi tên 2 đầu.',
    aiPrompt: 'a small white rectangular auxiliary plate with black arrows and distance text',
    clipPrompt: 'a small white rectangular auxiliary plate with black arrows and distance text',
    osmMapping: 'distance=100m; traffic_sign=VN:S.501',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 55',
    status: 'Active',
    version: 'v2.5',
  },
]

export const mockMissingSignTypeReports: MissingSignTypeReport[] = [
  {
    id: 'REP-MISS-01',
    tempLabel: 'Khu vực giới hạn xe máy điện (EV Scooter Only)',
    category: 'prohibitory',
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
