import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { AdminUserItem } from '@/data/adminGovernanceData'

export interface GetUsersQuery {
  search?: string
  role?: 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin' | 'all'
  status?: 'Active' | 'Suspended' | 'Pending' | 'all'
  page?: number
  limit?: number
}

export interface UpdateRoleDto {
  role: 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin'
  reason?: string
}

export interface ToggleStatusDto {
  status: 'Active' | 'Suspended'
  reason?: string
}

export const userService = {
  /**
   * Fetch paginated & filtered user list
   */
  getUsers: async (params?: GetUsersQuery): Promise<ApiResponse<AdminUserItem[]>> => {
    return http.get<ApiResponse<AdminUserItem[]>>(API_ENDPOINTS.USERS.BASE, { params })
  },

  /**
   * Get detailed profile of a single user
   */
  getUserById: async (userId: string): Promise<ApiResponse<AdminUserItem>> => {
    return http.get<ApiResponse<AdminUserItem>>(API_ENDPOINTS.USERS.DETAIL(userId))
  },

  /**
   * Update user system role (RBAC)
   */
  updateUserRole: async (userId: string, data: UpdateRoleDto): Promise<ApiResponse<AdminUserItem>> => {
    return http.patch<ApiResponse<AdminUserItem>>(API_ENDPOINTS.USERS.UPDATE_ROLE(userId), data)
  },

  /**
   * Lock or unlock user account
   */
  toggleUserStatus: async (userId: string, data: ToggleStatusDto): Promise<ApiResponse<AdminUserItem>> => {
    return http.patch<ApiResponse<AdminUserItem>>(API_ENDPOINTS.USERS.TOGGLE_STATUS(userId), data)
  },
}

export const UserService = userService
