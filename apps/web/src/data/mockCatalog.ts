export interface TrafficCatalogSign {
  code: string
  nameVi: string
  nameEn: string
  category: 'prohibitory' | 'warning' | 'mandatory' | 'guide' | 'speed_limit'
  shape: 'Circle' | 'Triangle' | 'Rectangle' | 'Octagon'
  color: 'Red-White' | 'Yellow-Black' | 'Blue-White' | 'Green-White'
  descriptionVi: string
  descriptionEn: string
  clipPrompt: string
  standardRef: string
}

export const mockTrafficCatalog: TrafficCatalogSign[] = [
  {
    code: 'P.102',
    nameVi: 'Cấm đi ngược chiều',
    nameEn: 'No Entry / Wrong Way',
    category: 'prohibitory',
    shape: 'Circle',
    color: 'Red-White',
    descriptionVi: 'Biển báo đường cấm tất cả các loại xe đi vào theo chiều đặt biển, trừ các xe được ưu tiên theo quy định.',
    descriptionEn: 'Prohibits all vehicles from entering in the direction where the sign is placed, except priority vehicles.',
    clipPrompt: 'a red circular traffic sign with a horizontal white bar in the center indicating no entry',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 15',
  },
  {
    code: 'P.103a',
    nameVi: 'Cấm ô tô',
    nameEn: 'No Cars / No Automobiles',
    category: 'prohibitory',
    shape: 'Circle',
    color: 'Red-White',
    descriptionVi: 'Báo đường cấm tất cả các loại xe cơ giới kể cả mô tô 3 bánh có thùng đi qua, trừ xe máy 2 bánh.',
    descriptionEn: 'Prohibits all motor vehicles including 3-wheeled motorbikes, except 2-wheeled motorbikes.',
    clipPrompt: 'a circular prohibitory traffic sign with a red border and a black car silhouette inside',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 16',
  },
  {
    code: 'P.127',
    nameVi: 'Tốc độ tối đa cho phép 60 km/h',
    nameEn: 'Maximum Speed Limit 60 km/h',
    category: 'speed_limit',
    shape: 'Circle',
    color: 'Red-White',
    descriptionVi: 'Biển báo tốc độ tối đa cho phép các xe cơ giới chạy là 60 km/h.',
    descriptionEn: 'Indicates the maximum permitted speed limit of 60 km/h for motor vehicles.',
    clipPrompt: 'a circular speed limit sign with a red border and the number 60 in black font on white background',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 24',
  },
  {
    code: 'P.124a',
    nameVi: 'Cấm quay đầu xe',
    nameEn: 'No U-Turn',
    category: 'prohibitory',
    shape: 'Circle',
    color: 'Red-White',
    descriptionVi: 'Biển báo cấm các loại xe quay đầu theo kiểu chữ U, trừ các xe được ưu tiên.',
    descriptionEn: 'Prohibits all vehicles from making a U-turn, except emergency vehicles.',
    clipPrompt: 'a circular traffic sign with red border and a black U-turn arrow crossed by a red diagonal slash',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 21',
  },
  {
    code: 'W.201a',
    nameVi: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    nameEn: 'Dangerous Curve to the Left',
    category: 'warning',
    shape: 'Triangle',
    color: 'Yellow-Black',
    descriptionVi: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm vòng về phía bên trái.',
    descriptionEn: 'Warns drivers of an approaching sharp or dangerous curve to the left.',
    clipPrompt: 'a yellow equilateral triangular warning sign with black border and a black arrow curving to the left',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 29',
  },
  {
    code: 'R.301a',
    nameVi: 'Hướng đi phải theo - Đi thẳng',
    nameEn: 'Mandatory Direction - Straight Only',
    category: 'mandatory',
    shape: 'Circle',
    color: 'Blue-White',
    descriptionVi: 'Bắt buộc các loại xe chỉ được đi thẳng ở nơi đặt biển.',
    descriptionEn: 'Mandates vehicles to proceed straight ahead only at the intersection.',
    clipPrompt: 'a round blue mandatory traffic sign with a straight white arrow pointing upwards',
    standardRef: 'QCVN 41:2019/BGTVT - Điều 36',
  },
]
