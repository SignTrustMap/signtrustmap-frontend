export interface KpiItem {
  label: string
  value: string
  change: string
  changeText: string
  isPositive?: boolean
  isWarning?: boolean
  isNeutral?: boolean
  iconBg: string
}

export interface ActivityItem {
  id: string
  type: string
  dotColor: string
  title: string
  desc: string
  user: string
  avatar: string | null
  time: string
}

export const adminKpisData: KpiItem[] = [
  {
    label: 'Tổng người dùng hệ thống',
    value: '142.8k',
    change: '+12.5%',
    changeText: 'so với tháng trước',
    isPositive: true,
    iconBg: 'bg-[#d3f7ff] text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de] dark:border dark:border-[#00c4de]/40 dark:shadow-[0_0_15px_rgba(0,196,222,0.25)]',
  },
  {
    label: 'Tài khoản nhân sự & KSV',
    value: '248',
    change: '+4',
    changeText: 'mới kích hoạt',
    isPositive: true,
    iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border dark:border-indigo-500/40 dark:shadow-[0_0_15px_rgba(99,102,241,0.25)]',
  },
  {
    label: 'Sự kiện kiểm toán (Audit)',
    value: '12.4k',
    change: '+8.1%',
    changeText: 'hoạt động ghi nhận',
    isNeutral: true,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/40 dark:shadow-[0_0_15px_rgba(34,197,94,0.25)]',
  },
  {
    label: 'Cảnh báo an ninh',
    value: '2',
    change: '-50%',
    changeText: 'so với tuần trước',
    isPositive: true,
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 dark:border dark:border-amber-500/40 dark:shadow-[0_0_15px_rgba(245,158,11,0.25)]',
  },
]

export const staffKpisData: KpiItem[] = [
  {
    label: 'Hồ sơ biển báo cần duyệt',
    value: '124',
    change: '+12',
    changeText: 'hồ sơ mới hôm nay',
    isWarning: true,
    iconBg: 'bg-[#d3f7ff] text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de] dark:border dark:border-[#00c4de]/40 dark:shadow-[0_0_15px_rgba(0,196,222,0.25)]',
  },
  {
    label: 'Sự cố biển báo tiếp nhận',
    value: '24',
    change: '3',
    changeText: 'chờ xử lý gấp',
    isWarning: true,
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/40 dark:shadow-[0_0_15px_rgba(239,68,68,0.25)]',
  },
  {
    label: 'Nhiệm vụ tái xác thực (Stale)',
    value: '58',
    change: '+5',
    changeText: 'có bằng chứng mới',
    isPositive: true,
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 dark:border dark:border-amber-500/40 dark:shadow-[0_0_15px_rgba(245,158,11,0.25)]',
  },
  {
    label: 'Điểm thưởng chờ thẩm định',
    value: '15',
    change: '3',
    changeText: 'giao dịch nghi vấn',
    isNeutral: true,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/40 dark:shadow-[0_0_15px_rgba(34,197,94,0.25)]',
  },
]

export const adminActivitiesData: ActivityItem[] = [
  {
    id: '1',
    type: 'critical',
    dotColor: 'bg-red-500',
    title: 'Phát hiện đăng nhập thất bại liên tiếp',
    desc: 'Tài khoản USR-1022 nhập sai mật khẩu 5 lần từ IP 198.51.100.22.',
    user: 'HỆ THỐNG',
    avatar: 'HT',
    time: '10:42 SA',
  },
  {
    id: '2',
    type: 'success',
    dotColor: 'bg-emerald-500',
    title: 'Thay đổi quyền hạn vai trò Kiểm duyệt viên',
    desc: 'Quản trị viên đã cấp thêm quyền duyệt điểm thưởng cho vai trò Reviewer.',
    user: 'Admin',
    avatar: 'AD',
    time: '09:15 SA',
  },
  {
    id: '3',
    type: 'info',
    dotColor: 'bg-blue-500',
    title: 'Sao lưu cơ sở dữ liệu định kỳ hoàn tất',
    desc: 'Tạo bản sao lưu không gian PostGIS dung lượng 4.2GB thành công.',
    user: 'SYS-BACKUP',
    avatar: null,
    time: '04:00 SA',
  },
]

export const staffActivitiesData: ActivityItem[] = [
  {
    id: '1',
    type: 'critical',
    dotColor: 'bg-red-500',
    title: 'Gắn cờ hồ sơ nghi vấn gian lận GPS',
    desc: 'Ứng viên CD-99012-XT gửi dữ liệu tọa độ không khớp với hành trình.',
    user: 'Kiểm duyệt tự động',
    avatar: 'BOT',
    time: '10:42 SA',
  },
  {
    id: '2',
    type: 'success',
    dotColor: 'bg-emerald-500',
    title: 'Đã xử lý sự cố biển báo #REP-2045',
    desc: 'Biển báo cấm ngược chiều tại Cầu Rồng đã được xác minh cập nhật.',
    user: 'Lê Hoàng Nam',
    avatar: 'LN',
    time: '09:15 SA',
  },
  {
    id: '3',
    type: 'info',
    dotColor: 'bg-blue-500',
    title: 'Bằng chứng tái xác thực mới được gửi',
    desc: 'Khảo sát viên gửi ảnh mới cho biển P.102 tại Ba Đình, Hà Nội.',
    user: 'Nguyễn Văn Hùng',
    avatar: 'NH',
    time: '08:30 SA',
  },
]
