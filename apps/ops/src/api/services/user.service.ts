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

export class UserService {
  /**
   * Fetch paginated & filtered user list
   */
  static async getUsers(params?: GetUsersQuery): Promise<ApiResponse<AdminUserItem[]>> {
    return http.get<ApiResponse<AdminUserItem[]>>(API_ENDPOINTS.USERS.BASE, { params })
  }

  /**
   * Get detailed profile of a single user
   */
  static async getUserById(userId: string): Promise<ApiResponse<AdminUserItem>> {
    return http.get<ApiResponse<AdminUserItem>>(API_ENDPOINTS.USERS.DETAIL(userId))
  }

  /**
   * Update user system role (RBAC)
   */
  static async updateUserRole(userId: string, data: UpdateRoleDto): Promise<ApiResponse<AdminUserItem>> {
    return http.patch<ApiResponse<AdminUserItem>>(API_ENDPOINTS.USERS.UPDATE_ROLE(userId), data)
  }

  /**
   * Lock or unlock user account
   */
  static async toggleUserStatus(userId: string, data: ToggleStatusDto): Promise<ApiResponse<AdminUserItem>> {
    return http.patch<ApiResponse<AdminUserItem>>(API_ENDPOINTS.USERS.TOGGLE_STATUS(userId), data)
  }
}
