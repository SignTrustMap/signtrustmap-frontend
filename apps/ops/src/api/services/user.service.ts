import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface BackendUserItem {
  id: string
  email: string
  full_name: string
  phone?: string | null
  avatar_url?: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  created_at: string
  updated_at: string
  roles: string[]
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
    return http.get<BackendUserItem>(API_ENDPOINTS.USERS.DETAIL(userId))
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
