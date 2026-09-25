export type StaffStatus = 'Active' | 'Suspended' | 'Inactive'

export interface SystemUser {
  id: string
  name: string
  email: string
  initials: string
  avatarBg: string
  role: 'Admin' | 'Staff' | 'Reviewer' | 'Surveyor' | 'Driver'
  status: StaffStatus
  location: string
  lastActive: string
}

export const mockSystemUsers: SystemUser[] = [
  {
    id: 'USR-001',
    name: 'Phan Tài Đức',
    email: 'admin@signtrustmap.site',
    initials: 'PĐ',
    avatarBg: 'bg-[#007b8b] text-white',
    role: 'Admin',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: 'Vừa xong',
  },
  {
    id: 'USR-002',
    name: 'Nguyễn Long Vũ',
    email: 'staff@signtrustmap.site',
    initials: 'NV',
    avatarBg: 'bg-[#ffedd5] text-[#c2410c]',
    role: 'Staff',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: '12 phút trước',
  },
  {
    id: 'USR-003',
    name: 'Nguyễn Lê Quang Hưng',
    email: 'reviewer@signtrustmap.site',
    initials: 'NH',
    avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]',
    role: 'Reviewer',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: '2 giờ trước',
  },
  {
    id: 'USR-004',
    name: 'Nguyễn Phúc Khang',
    email: 'surveyor@signtrustmap.site',
    initials: 'NK',
    avatarBg: 'bg-teal-100 text-teal-800',
    role: 'Surveyor',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: '10 phút trước',
  },
  {
    id: 'USR-005',
    name: 'Lương Minh Nhật',
    email: 'driver@signtrustmap.site',
    initials: 'LN',
    avatarBg: 'bg-amber-100 text-amber-800',
    role: 'Driver',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: '30 phút trước',
  },
]
