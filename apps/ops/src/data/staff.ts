export type StaffStatus = 'Active' | 'Suspended' | 'Inactive'

export interface SystemUser {
  id: string
  name: string
  email: string
  initials: string
  avatarBg: string
  role: 'Quản trị viên' | 'Quản lý vận hành' | 'Kiểm duyệt viên' | 'Hỗ trợ'
  status: StaffStatus
  location: string
  lastActive: string
}

export const mockSystemUsers: SystemUser[] = [
  {
    id: 'USR-001',
    name: 'Alexander Wright',
    email: 'a.wright@signtrustmap.site',
    initials: 'AW',
    avatarBg: 'bg-[#007b8b] text-white',
    role: 'Quản trị viên',
    status: 'Active',
    location: 'Hà Nội (Trụ sở chính)',
    lastActive: 'Vừa xong',
  },
  {
    id: 'USR-002',
    name: 'Elena Rostova',
    email: 'e.rostova@signtrustmap.site',
    initials: 'ER',
    avatarBg: 'bg-[#ffedd5] text-[#c2410c]',
    role: 'Quản lý vận hành',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: '12 phút trước',
  },
  {
    id: 'USR-003',
    name: 'Marcus Chen',
    email: 'm.chen@signtrustmap.site',
    initials: 'MC',
    avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]',
    role: 'Kiểm duyệt viên',
    status: 'Active',
    location: 'Đà Nẵng',
    lastActive: '2 giờ trước',
  },
  {
    id: 'USR-004',
    name: 'Sarah Jenkins',
    email: 's.jenkins@signtrustmap.site',
    initials: 'SJ',
    avatarBg: 'bg-gray-200 text-gray-700',
    role: 'Kiểm duyệt viên',
    status: 'Inactive',
    location: 'Cần Thơ',
    lastActive: '3 ngày trước',
  },
  {
    id: 'USR-005',
    name: 'Tariq Al-Mansoor',
    email: 't.almansoor@signtrustmap.site',
    initials: 'TA',
    avatarBg: 'bg-[#fee2e2] text-[#b91c1c]',
    role: 'Hỗ trợ',
    status: 'Suspended',
    location: 'Hải Phòng',
    lastActive: '1 tuần trước',
  },
]
