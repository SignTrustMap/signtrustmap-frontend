export type EventType = 'Permission' | 'Config' | 'Login' | 'Alert' | 'Data Access'

export interface AuditLogItem {
  id: string
  timestamp: string
  user: {
    name: string
    initials: string
    avatarBg: string
  }
  eventType: EventType
  action: string
  targetId: string
  ipAddress: string
}

export const mockAuditLogs: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: '31/10/2023 14:23:05',
    user: { name: 'john.doe', initials: 'JD', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    eventType: 'Permission',
    action: "Thay đổi quyền hạn: Cấp quyền 'Quản trị viên' cho tài khoản #1042",
    targetId: 'USR-9942',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-2',
    timestamp: '31/10/2023 13:10:12',
    user: { name: 'admin.sys', initials: 'AS', avatarBg: 'bg-[#007b8b] text-white' },
    eventType: 'Config',
    action: 'Cập nhật cài đặt: Thời gian hết hạn phiên tăng từ 30p lên 60p',
    targetId: 'SYS-CFG-01',
    ipAddress: '10.0.0.12',
  },
  {
    id: 'log-3',
    timestamp: '31/10/2023 11:45:00',
    user: { name: 'm.klay', initials: 'MK', avatarBg: 'bg-gray-200 text-gray-700' },
    eventType: 'Login',
    action: 'Đăng nhập thành công qua Google Workspace SSO',
    targetId: '-',
    ipAddress: '203.0.113.89',
  },
  {
    id: 'log-4',
    timestamp: '31/10/2023 09:22:18',
    user: { name: 'HỆ THỐNG', initials: 'HT', avatarBg: 'bg-[#fee2e2] text-[#b91c1c]' },
    eventType: 'Alert',
    action: 'Phát hiện nhiều lần đăng nhập thất bại liên tiếp vào tài khoản',
    targetId: 'USR-1022',
    ipAddress: '198.51.100.22',
  },
  {
    id: 'log-5',
    timestamp: '30/10/2023 16:55:40',
    user: { name: 'john.doe', initials: 'JD', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    eventType: 'Data Access',
    action: 'Xuất danh sách nhân sự sang tệp CSV kèm thống kê kiểm duyệt',
    targetId: 'REP-EMP-04',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-6',
    timestamp: '30/10/2023 14:10:02',
    user: { name: 'l.jones', initials: 'LJ', avatarBg: 'bg-gray-200 text-gray-700' },
    eventType: 'Login',
    action: 'Đăng xuất tài khoản và hủy phiên làm việc an toàn',
    targetId: '-',
    ipAddress: '198.51.100.144',
  },
]
