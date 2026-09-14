/**
 * Mock demo accounts for SignTrustMap Operations Portal
 * Synchronized with Community Portal (apps/web)
 */

export type PortalRole = 'admin' | 'staff' | 'reviewer' | 'surveyor' | 'driver'

export interface DemoAccount {
  id: string
  role: PortalRole
  label: string
  icon: string
  email: string
  password: string
  name: string
  avatar: string
  initials: string
  isOpsAuthorized: boolean
}

export const mockOpsDemoAccounts: DemoAccount[] = [
  {
    id: 'demo-driver',
    role: 'driver',
    label: 'Driver',
    icon: '🚗',
    email: 'driver@signtrustmap.com',
    password: 'password123',
    name: 'Lương Minh Nhật',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=250&auto=format&fit=crop&q=80',
    initials: 'LN',
    isOpsAuthorized: false,
  },
  {
    id: 'demo-surveyor',
    role: 'surveyor',
    label: 'Surveyor',
    icon: '📹',
    email: 'surveyor@signtrustmap.com',
    password: 'password123',
    name: 'Nguyễn Phúc Khang',
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=250&auto=format&fit=crop&q=80',
    initials: 'NK',
    isOpsAuthorized: false,
  },
  {
    id: 'demo-reviewer',
    role: 'reviewer',
    label: 'Reviewer',
    icon: '⚖️',
    email: 'reviewer@signtrustmap.com',
    password: 'password123',
    name: 'Nguyễn Lê Quang Hưng',
    avatar: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=250&auto=format&fit=crop&q=80',
    initials: 'NH',
    isOpsAuthorized: false,
  },
  {
    id: 'demo-staff',
    role: 'staff',
    label: 'Staff',
    icon: '👤',
    email: 'staff@signtrustmap.com',
    password: 'password123',
    name: 'Nguyễn Long Vũ',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=250&auto=format&fit=crop&q=80',
    initials: 'NV',
    isOpsAuthorized: true,
  },
  {
    id: 'demo-admin',
    role: 'admin',
    label: 'Admin',
    icon: '⚡',
    email: 'admin@signtrustmap.com',
    password: 'password123',
    name: 'Phan Tài Đức',
    avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=250&auto=format&fit=crop&q=80',
    initials: 'PĐ',
    isOpsAuthorized: true,
  },
]
