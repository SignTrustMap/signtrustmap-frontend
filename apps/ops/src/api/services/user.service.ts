import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface BackendUserItem {
  id: string
  email: string
  full_name: string
  fullName?: string
  phone?: string | null
  avatar_url?: string | null
  avatarUrl?: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  created_at: string
  createdAt?: string
  updated_at: string
  updatedAt?: string
  roles: string[]
  statistics?: Record<string, any>
}

export interface UserProfileSummary {
  id?: string
  fullName?: string | null
  full_name?: string | null
  email?: string | null
  avatarUrl?: string | null
  avatar_url?: string | null
}

/**
 * Normalizes user payloads returned from either snake_case list APIs or camelCase detail APIs.
 */
export function normalizeUserProfile(raw: any): BackendUserItem {
  const fullName = raw?.full_name ?? raw?.fullName ?? ''
  const avatarUrl = raw?.avatar_url ?? raw?.avatarUrl ?? null
  const createdAt = raw?.created_at ?? raw?.createdAt ?? ''
  const updatedAt = raw?.updated_at ?? raw?.updatedAt ?? createdAt
  return {
    id: String(raw?.id || ''),
    email: raw?.email || '',
    full_name: fullName,
    fullName,
    phone: raw?.phone ?? null,
    avatar_url: avatarUrl,
    avatarUrl,
    status: (String(raw?.status || 'ACTIVE').toUpperCase() as BackendUserItem['status']),
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
    roles: Array.isArray(raw?.roles) ? raw.roles : [],
    statistics: raw?.statistics,
  }
}

const userProfileCache = new Map<string, BackendUserItem>()
const userProfileInFlight = new Map<string, Promise<BackendUserItem>>()

export function getCachedUserProfile(userId?: string | null): BackendUserItem | undefined {
  if (!userId) return undefined
  return userProfileCache.get(userId)
}

export interface PaginatedUsersResponse {
  items: BackendUserItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetUsersQuery {
  search?: string
  role?: string
  status?: string
  page?: number
  pageSize?: number
  limit?: number
}

export interface UpdateUserStatusDto {
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  reason?: string
}

export interface AssignRoleDto {
  roleCode: 'ADMIN' | 'STAFF' | 'SURVEYOR' | 'REVIEWER' | 'DRIVER' | 'MODERATOR' | string
  isActive?: boolean
}

// Backwards compatibility types
export interface UpdateRoleDto {
  role: string
  reason?: string
}

export interface ToggleStatusDto {
  status: 'Active' | 'Suspended' | 'Banned' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  reason?: string
}

export const userService = {
  /**
   * Fetch paginated & filtered user list from /api/v1/admin/users
   */
  getUsers: async (params?: GetUsersQuery): Promise<PaginatedUsersResponse> => {
    const queryParams: Record<string, any> = {}
    if (params?.search) queryParams.search = params.search
    if (params?.role && params.role !== 'all') queryParams.role = params.role.toUpperCase()
    if (params?.status && params.status !== 'all') queryParams.status = params.status.toUpperCase()
    if (params?.page) queryParams.page = params.page
    if (params?.pageSize || params?.limit) queryParams.pageSize = params.pageSize || params.limit

    return http.get<PaginatedUsersResponse>(API_ENDPOINTS.USERS.BASE, { params: queryParams })
  },

  /**
   * Get detailed profile of a single user
   */
  getUserById: async (userId: string): Promise<BackendUserItem> => {
    const res = await http.get<any>(API_ENDPOINTS.USERS.DETAIL(userId))
    const normalized = normalizeUserProfile(res?.data || res)
    if (normalized.id) userProfileCache.set(normalized.id, normalized)
    return normalized
  },

  /**
   * Fetch and cache user profile by UUID, falling back to /moderation/users/:id when needed.
   */
  getUserProfileById: async (userId: string): Promise<BackendUserItem> => {
    const cached = userProfileCache.get(userId)
    if (cached) return cached

    const existing = userProfileInFlight.get(userId)
    if (existing) return existing

    const req = (async () => {
      try {
        return await userService.getUserById(userId)
      } catch {
        const res = await http.get<any>(API_ENDPOINTS.MODERATION.USER_PROFILE(userId))
        const normalized = normalizeUserProfile(res?.data || res)
        if (normalized.id) userProfileCache.set(normalized.id, normalized)
        return normalized
      } finally {
        userProfileInFlight.delete(userId)
      }
    })()

    userProfileInFlight.set(userId, req)
    return req
  },

  /**
   * Update user status (ACTIVE, SUSPENDED, BANNED) with audit reason via /api/v1/admin/users/:id/status
   */
  updateStatus: async (userId: string, data: UpdateUserStatusDto): Promise<{ userId: string; oldStatus: string; newStatus: string }> => {
    return http.patch<{ userId: string; oldStatus: string; newStatus: string }>(
      API_ENDPOINTS.USERS.UPDATE_STATUS(userId),
      {
        status: data.status.toUpperCase(),
        reason: data.reason || 'Admin status update from Ops Portal',
      }
    )
  },

  /**
   * Assign or revoke role for user via /api/v1/admin/users/:id/roles
   */
  assignRole: async (userId: string, data: AssignRoleDto): Promise<{ userId: string; roleCode: string; roleId: number; isActive: boolean }> => {
    return http.post<{ userId: string; roleCode: string; roleId: number; isActive: boolean }>(
      API_ENDPOINTS.USERS.ASSIGN_ROLE(userId),
      {
        roleCode: data.roleCode.toUpperCase(),
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    )
  },

  // ── Backward Compatibility Helpers ──────────────────────────────
  updateUserRole: async (userId: string, data: UpdateRoleDto): Promise<any> => {
    return userService.assignRole(userId, { roleCode: data.role.toUpperCase(), isActive: true })
  },

  toggleUserStatus: async (userId: string, data: ToggleStatusDto): Promise<any> => {
    const normalizedStatus = data.status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'BANNED'
    return userService.updateStatus(userId, { status: normalizedStatus, reason: data.reason })
  },
}

export const UserService = userService
