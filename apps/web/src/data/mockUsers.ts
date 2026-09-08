/**
 * Centralized mock user data for demo & rapid testing
 */

export type UserRole =
  | 'DRIVER'
  | 'SURVEYOR'
  | 'REVIEWER'
  | 'STAFF'
  | 'ADMIN'
  | 'driver'
  | 'surveyor'
  | 'reviewer'
  | 'staff'
  | 'admin'

export interface DemoUserAccount {
  id: string
  role: UserRole
  label: string
  icon: string
  email: string
  password: string
  name: string
  avatar?: string
  credits?: number
  trustScore?: number
  totalSubmissions?: number
  validatedCount?: number
  joinDate?: string
}

export function normalizeRole(role?: string): 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin' {
  const r = (role || '').trim().toLowerCase()
  if (r === 'admin') return 'admin'
  if (r === 'staff') return 'staff'
  if (r === 'reviewer') return 'reviewer'
  if (r === 'surveyor') return 'surveyor'
  return 'driver'
}

export function formatRoleName(role?: string): 'Driver' | 'Surveyor' | 'Reviewer' | 'Staff' | 'Admin' {
  const normalized = normalizeRole(role)
  switch (normalized) {
    case 'admin':
      return 'Admin'
    case 'staff':
      return 'Staff'
    case 'reviewer':
      return 'Reviewer'
    case 'surveyor':
      return 'Surveyor'
    default:
      return 'Driver'
  }
}

export const mockDemoAccounts: DemoUserAccount[] = [
  {
    id: 'demo-driver',
    role: 'driver',
    label: 'Driver',
    icon: '🚗',
    email: 'driver@signtrustmap.com',
    password: 'password123',
    name: 'Lương Minh Nhật',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=250&auto=format&fit=crop&q=80',
    credits: 150,
    trustScore: 92,
    totalSubmissions: 6,
    validatedCount: 2,
    joinDate: '15/05/2026',
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
    credits: 450,
    trustScore: 95,
    totalSubmissions: 28,
    validatedCount: 14,
    joinDate: '02/03/2026',
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
    credits: 890,
    trustScore: 99,
    totalSubmissions: 52,
    validatedCount: 312,
    joinDate: '10/01/2026',
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
    credits: 200,
    trustScore: 100,
    joinDate: '01/01/2026',
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
    credits: 500,
    trustScore: 100,
    joinDate: '01/01/2026',
  },
]
