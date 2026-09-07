export interface RoleDefinition {
  id: string
  name: { vi: string; en: string }
  desc: { vi: string; en: string }
  isSystemDefault?: boolean
  permissions: {
    userMgt: { read: boolean; create: boolean; update: boolean; delete: boolean }
    taskApproval: { read: boolean; create: boolean; update: boolean; delete: boolean }
    financials: { read: boolean; create: boolean; update: boolean; delete: boolean }
    systemLogs: { read: boolean; create: boolean; update: boolean; delete: boolean }
  }
}

export type PermModuleKey = 'userMgt' | 'taskApproval' | 'financials' | 'systemLogs'
export type PermActionKey = 'read' | 'create' | 'update' | 'delete'

export interface PermCategory {
  key: string
  module: PermModuleKey
  nameKey: string
  actions: PermActionKey[]
}

export const PERMISSION_CATEGORIES: PermCategory[] = [
  {
    key: 'cat_userMgt',
    module: 'userMgt',
    nameKey: 'roles.cat_userMgt',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'cat_taskApproval',
    module: 'taskApproval',
    nameKey: 'roles.cat_taskApproval',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'cat_financials',
    module: 'financials',
    nameKey: 'roles.cat_financials',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'cat_systemLogs',
    module: 'systemLogs',
    nameKey: 'roles.cat_systemLogs',
    actions: ['read', 'create', 'update', 'delete'],
  },
]

export const mockRoles: RoleDefinition[] = [
  {
    id: 'admin',
    name: { vi: 'Admin', en: 'Admin' },
    desc: { vi: 'Toàn quyền quản trị nền tảng, AI MLOps và cấu hình hệ thống', en: 'Full platform governance, AI MLOps, and system configuration' },
    isSystemDefault: true,
    permissions: {
      userMgt: { read: true, create: true, update: true, delete: true },
      taskApproval: { read: true, create: true, update: true, delete: true },
      financials: { read: true, create: true, update: true, delete: true },
      systemLogs: { read: true, create: true, update: true, delete: true },
    },
  },
  {
    id: 'staff',
    name: { vi: 'Staff', en: 'Staff' },
    desc: { vi: 'Kiểm duyệt hồ sơ vi phạm, xác minh sự cố và xử lý tái kiểm định', en: 'Moderate candidate violations, verify reports, and handle revalidation' },
    permissions: {
      userMgt: { read: true, create: true, update: true, delete: false },
      taskApproval: { read: true, create: true, update: true, delete: false },
      financials: { read: true, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'reviewer',
    name: { vi: 'Reviewer', en: 'Reviewer' },
    desc: { vi: 'Bỏ phiếu đồng thuận xác thực biển báo và nhận điểm tin cậy', en: 'Consensus voting on traffic sign candidates with reliability scoring' },
    permissions: {
      userMgt: { read: false, create: false, update: false, delete: false },
      taskApproval: { read: true, create: true, update: false, delete: false },
      financials: { read: true, create: false, update: false, delete: false },
      systemLogs: { read: false, create: false, update: false, delete: false },
    },
  },
  {
    id: 'surveyor',
    name: { vi: 'Surveyor', en: 'Surveyor' },
    desc: { vi: 'Tải lên video hành trình, tạo hành trình và nhận thưởng khảo sát', en: 'Upload dashcam trip footage, submit surveys, and earn rewards' },
    permissions: {
      userMgt: { read: false, create: false, update: false, delete: false },
      taskApproval: { read: true, create: false, update: false, delete: false },
      financials: { read: true, create: false, update: false, delete: false },
      systemLogs: { read: false, create: false, update: false, delete: false },
    },
  },
  {
    id: 'driver',
    name: { vi: 'Driver', en: 'Driver' },
    desc: { vi: 'Dẫn đường cảnh báo biển báo thực tế và nộp báo cáo sự cố', en: 'Live road sign navigation and submit road hazard reports' },
    permissions: {
      userMgt: { read: false, create: false, update: false, delete: false },
      taskApproval: { read: false, create: false, update: false, delete: false },
      financials: { read: true, create: false, update: false, delete: false },
      systemLogs: { read: false, create: false, update: false, delete: false },
    },
  },
]
