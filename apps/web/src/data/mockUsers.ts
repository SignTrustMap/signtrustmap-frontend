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
    name: 'Lê Ngọc Nguyễn Minh Khôi',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    credits: 120,
    trustScore: 88,
    totalSubmissions: 4,
    validatedCount: 0,
    joinDate: '15/05/2026',
  },
  {
    id: 'demo-surveyor',
    role: 'surveyor',
    label: 'Surveyor',
    icon: '📹',
    email: 'surveyor@signtrustmap.com',
    password: 'password123',
    name: 'Tuấn Kiệt',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    credits: 450,
    trustScore: 94,
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
    name: 'Bảo Anh',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
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
    name: 'Quang Huy',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    credits: 0,
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
    name: 'Đức Thành',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    credits: 0,
    trustScore: 100,
    joinDate: '01/01/2026',
  },
]
