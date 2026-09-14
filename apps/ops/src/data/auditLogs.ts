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
    id: 'LOG-2026-001',
    timestamp: '2026-08-30 15:45:12',
    user: { name: 'Phan Tài Đức (Admin)', initials: 'PĐ', avatarBg: 'bg-purple-600 text-white' },
    eventType: 'Config',
    action: 'Ghi đè thuộc tính không gian biển báo P.127 (Cao tốc Long Thành) theo phê duyệt #ESC-2026-001',
    targetId: 'SIGN-VN-70891',
    ipAddress: '14.161.40.22',
  },
  {
    id: 'LOG-2026-002',
    timestamp: '2026-08-30 14:10:05',
    user: { name: 'Nguyễn Long Vũ (Staff)', initials: 'NV', avatarBg: 'bg-[#007b8b] text-white' },
    eventType: 'Permission',
    action: 'Trình duyệt ca phê chuẩn Cấp cao: Đề xuất bổ sung biển LED tốc độ vào Danh mục QCVN 41:2019',
    targetId: 'CAT-LED-P106a',
    ipAddress: '113.161.72.18',
  },
  {
    id: 'LOG-2026-003',
    timestamp: '2026-08-30 11:22:40',
    user: { name: 'HỆ THỐNG AN NINH', initials: 'HT', avatarBg: 'bg-red-600 text-white' },
    eventType: 'Alert',
    action: 'Phát hiện giả lập tọa độ GPS bất thường (vượt quá 150 km/h trong đô thị), tự động gắn cờ tài khoản',
    targetId: 'USR-008',
    ipAddress: '171.244.10.85',
  },
  {
    id: 'LOG-2026-004',
    timestamp: '2026-08-30 09:15:30',
    user: { name: 'Phan Tài Đức (Admin)', initials: 'PĐ', avatarBg: 'bg-purple-600 text-white' },
    eventType: 'Config',
    action: 'Cập nhật tham số Active Learning MLOps: Entropy threshold 0.85 & Retraining batch 15.000 samples',
    targetId: 'CFG-MLOPS-AL',
    ipAddress: '14.161.40.22',
  },
  {
    id: 'LOG-2026-005',
    timestamp: '2026-08-29 16:30:18',
    user: { name: 'Nguyễn Long Vũ (Staff)', initials: 'NV', avatarBg: 'bg-[#007b8b] text-white' },
    eventType: 'Data Access',
    action: 'Xuất dữ liệu đối soát giao dịch điểm thưởng và danh sách biển báo xác thực tháng 8/2026',
    targetId: 'REP-EXP-202608',
    ipAddress: '113.161.72.18',
  },
  {
    id: 'LOG-2026-006',
    timestamp: '2026-08-29 08:00:15',
    user: { name: 'Phan Tài Đức (Admin)', initials: 'PĐ', avatarBg: 'bg-purple-600 text-white' },
    eventType: 'Login',
    action: 'Đăng nhập thành công vào Cổng quản trị Vận hành SignTrustMap Ops Portal',
    targetId: 'SESSION-ADM-01',
    ipAddress: '14.161.40.22',
  },
]
