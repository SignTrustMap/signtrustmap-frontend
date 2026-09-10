export type ReportStatus = 'Pending' | 'Investigating' | 'Resolved'
export type IssueType = 'damaged' | 'obscured' | 'missing' | 'incorrect'
export type ReportPriority = 'Cao' | 'Vừa' | 'Thấp'

export interface SignReportItem {
  id: string
  signCode: string
  signName: string
  issueType: IssueType
  priority: ReportPriority
  location: string
  reporter: {
    name: string
    initials: string
    avatarBg: string
    phone?: string
  }
  dateSubmitted: string
  status: ReportStatus
  description: string
  photoUrl: string
  assignedStaff?: string
  resolvedDate?: string
}

export const mockSignReports: SignReportItem[] = [
  {
    id: '#REP-2049',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    issueType: 'damaged',
    priority: 'Cao',
    location: 'Số 124 Nguyễn Thái Học, Ba Đình, Hà Nội',
    reporter: { name: 'Nguyễn Văn Hùng', initials: 'NH', avatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-[#00c4de]', phone: '0912.345.678' },
    dateSubmitted: '24/10/2026',
    status: 'Pending',
    description: 'Mặt biển bị móp méo nghiêm trọng do xe tải quẹt trúng, ban đêm mất phản quang gây nguy hiểm cho tài xế.',
    photoUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '#REP-2048',
    signCode: 'W.207a',
    signName: 'Giao nhau với đường không ưu tiên',
    issueType: 'obscured',
    priority: 'Cao',
    location: 'Ngã tư Trần Phú - Điện Biên Phủ, Ba Đình, Hà Nội',
    reporter: { name: 'Trần Thị Mai', initials: 'TM', avatarBg: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300', phone: '0983.112.233' },
    dateSubmitted: '23/10/2026',
    status: 'Investigating',
    description: 'Cành cây phượng sum suê che khuất hoàn toàn tầm nhìn biển cảnh báo từ cự ly 30m, cần cắt tỉa hoặc dời vị trí cột.',
    photoUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    assignedStaff: 'Trần Hoàng Long',
  },
  {
    id: '#REP-2047',
    signCode: 'P.130',
    signName: 'Cấm dừng xe và đỗ xe',
    issueType: 'missing',
    priority: 'Cao',
    location: 'Đường Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
    reporter: { name: 'Lê Hoàng Nam', initials: 'LN', avatarBg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300', phone: '0903.456.789' },
    dateSubmitted: '22/10/2026',
    status: 'Pending',
    description: 'Biển báo đã bị tháo dỡ do công trình chỉnh trang vỉa hè nhưng chưa lắp đặt lại, các phương tiện dừng đỗ tràn lan gây ách tắc.',
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '#REP-2046',
    signCode: 'P.127',
    signName: 'Tốc độ tối đa cho phép (50 km/h)',
    issueType: 'incorrect',
    priority: 'Vừa',
    location: 'Km 18+200 Quốc lộ 1A, Hòa Vang, Đà Nẵng',
    reporter: { name: 'Phạm Hồng Phúc', initials: 'PP', avatarBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-[#00c4de]', phone: '0977.888.999' },
    dateSubmitted: '21/10/2026',
    status: 'Investigating',
    description: 'Dữ liệu ứng dụng hiển thị hạn mức 60 km/h nhưng biển thực tế đã cắm biển 50 km/h từ tuần trước.',
    photoUrl: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&auto=format&fit=crop&q=80',
    assignedStaff: 'Lê Thu Trang',
  },
  {
    id: '#REP-2045',
    signCode: 'R.301a',
    signName: 'Hướng đi phải theo (Đi thẳng)',
    issueType: 'damaged',
    priority: 'Thấp',
    location: 'Cầu Rồng, Đường Bạch Đằng, Hải Châu, Đà Nẵng',
    reporter: { name: 'Hoàng Nhật Nam', initials: 'HN', avatarBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', phone: '0935.123.456' },
    dateSubmitted: '20/10/2026',
    status: 'Resolved',
    description: 'Chân cột biển báo bị nghiêng 15 độ, đơn vị duy tu đã khắc phục đổ bê tông chân đế và cân chỉnh thẳng hàng.',
    photoUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    assignedStaff: 'Trần Hoàng Long',
    resolvedDate: '21/10/2026',
  },
  {
    id: '#REP-2044',
    signCode: 'P.103a',
    signName: 'Cấm xe ô tô',
    issueType: 'obscured',
    priority: 'Vừa',
    location: 'Số 88 Võ Thị Sáu, Phường 6, Quận 3, TP.HCM',
    reporter: { name: 'Vũ Đức Thịnh', initials: 'VT', avatarBg: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', phone: '0944.556.677' },
    dateSubmitted: '19/10/2026',
    status: 'Pending',
    description: 'Biển bị biển quảng cáo của cửa hàng bên cạnh che lấp góc nhìn khi rẽ vào từ đường Hai Bà Trưng.',
    photoUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '#REP-2043',
    signCode: 'W.224',
    signName: 'Người đi bộ qua đường',
    issueType: 'damaged',
    priority: 'Vừa',
    location: 'Số 165 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội',
    reporter: { name: 'Đỗ Thị Hương', initials: 'DH', avatarBg: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300', phone: '0918.234.567' },
    dateSubmitted: '18/10/2026',
    status: 'Investigating',
    description: 'Bị bong tróc sơn phản quang sau đợt mưa lớn, vạch đi bộ mờ nhạt gây nguy hiểm cho người đi bộ qua đường.',
    photoUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    assignedStaff: 'Lê Hoàng Nam',
  },
  {
    id: '#REP-2042',
    signCode: 'I.401',
    signName: 'Bắt đầu đường ưu tiên',
    issueType: 'incorrect',
    priority: 'Thấp',
    location: 'Đường Hoàng Diệu, Điện Biên, Ba Đình, Hà Nội',
    reporter: { name: 'Bùi Thanh Tùng', initials: 'BT', avatarBg: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-[#00c4de]', phone: '0988.999.000' },
    dateSubmitted: '17/10/2026',
    status: 'Resolved',
    description: 'Tọa độ ghim trên bản đồ lệch sang làn đối diện 25m, đã được Staff điều chỉnh lại đúng tim đường.',
    photoUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    assignedStaff: 'Trần Hoàng Long',
    resolvedDate: '18/10/2026',
  },
]
