export interface RoleDefinition {
  id: string
  name: string
  desc: string
  isSystemDefault?: boolean
  permissions: {
    userMgt: { read: boolean; create: boolean; update: boolean; delete: boolean }
    taskApproval: { read: boolean; create: boolean; update: boolean; delete: boolean }
    financials: { read: boolean; create: boolean; update: boolean; delete: boolean }
    systemLogs: { read: boolean; create: boolean; update: boolean; delete: boolean }
  }
}

export const mockRoles: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Quản trị viên cấp cao',
    desc: 'Toàn quyền truy cập hệ thống',
    isSystemDefault: true,
    permissions: {
      userMgt: { read: true, create: true, update: true, delete: true },
      taskApproval: { read: true, create: true, update: true, delete: false },
      financials: { read: true, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'staff_mgr',
    name: 'Quản lý vận hành',
    desc: 'Quản lý nhân sự và lịch trình',
    permissions: {
      userMgt: { read: true, create: true, update: true, delete: false },
      taskApproval: { read: true, create: true, update: true, delete: false },
      financials: { read: false, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'reviewer',
    name: 'Kiểm duyệt viên',
    desc: 'Quyền xem và duyệt kiểm toán',
    permissions: {
      userMgt: { read: true, create: false, update: false, delete: false },
      taskApproval: { read: true, create: false, update: false, delete: false },
      financials: { read: false, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'support',
    name: 'Nhân viên hỗ trợ',
    desc: 'Tiếp nhận phản ánh & nhật ký cơ bản',
    permissions: {
      userMgt: { read: true, create: false, update: false, delete: false },
      taskApproval: { read: false, create: false, update: false, delete: false },
      financials: { read: false, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
]
