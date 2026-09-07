import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { RoleDefinition } from '@/data/roles'

export interface UpdateRolePermissionsDto {
  permissions: RoleDefinition['permissions']
}

export class RoleService {
  /**
   * Fetch all roles and their permission matrix
   */
  static async getRoles(): Promise<ApiResponse<RoleDefinition[]>> {
    return http.get<ApiResponse<RoleDefinition[]>>(API_ENDPOINTS.ROLES.BASE)
  }

  /**
   * Update granular permissions for a role
   */
  static async updatePermissions(roleId: string, data: UpdateRolePermissionsDto): Promise<ApiResponse<RoleDefinition>> {
    return http.put<ApiResponse<RoleDefinition>>(API_ENDPOINTS.ROLES.UPDATE_PERMISSIONS(roleId), data)
  }
}
