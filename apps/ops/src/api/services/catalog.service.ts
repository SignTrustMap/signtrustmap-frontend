import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface SignCategoryItem {
  id: number
  code: string
  nameVi: string
  nameEn: string
  description?: string | null
  iconUrl?: string | null
  sortOrder?: number
}

export interface CatalogSignTypeItem {
  id: number
  categoryId: number
  signCode: string
  nameVi: string
  nameEn: string
  description?: string | null
  labelingGuidelines?: string | null
  shape?: string | null
  colorScheme?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  category?: SignCategoryItem
  aiLabelPrompt?: string | null
  osmMapping?: string | null
  representativeImageKey?: string | null
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ListSignTypesParams {
  categoryId?: number
  isActive?: boolean
  search?: string
  page?: number
  size?: number
}

export interface CreateSignTypeInput {
  categoryId: number
  signCode: string
  nameVi: string
  nameEn: string
  description?: string
  labelingGuidelines?: string
  aiLabelPrompt?: string
  osmMapping?: string
  representativeImageKey?: string
  shape?: string
  colorScheme?: string
  isActive?: boolean
}

export interface CreateSignCategoryInput {
  code: string
  nameVi: string
  nameEn: string
  description?: string
  iconUrl?: string
  sortOrder?: number
}

export class CatalogService {
  static async getSignTypes(params?: ListSignTypesParams): Promise<PageResponse<CatalogSignTypeItem>> {
    return http.get<PageResponse<CatalogSignTypeItem>>(API_ENDPOINTS.CATALOG.SIGN_TYPES, { params })
  }

  static async getSignType(id: number | string): Promise<CatalogSignTypeItem> {
    return http.get<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id))
  }

  static async createSignType(data: CreateSignTypeInput): Promise<CatalogSignTypeItem> {
    return http.post<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPES, data)
  }

  static async updateSignType(id: number | string, data: Partial<CreateSignTypeInput>): Promise<CatalogSignTypeItem> {
    return http.patch<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id), data)
  }

  static async deleteSignType(id: number | string): Promise<void> {
    return http.delete<void>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id))
  }

  static async getCategories(): Promise<SignCategoryItem[]> {
    return http.get<SignCategoryItem[]>(API_ENDPOINTS.CATALOG.CATEGORIES)
  }

  static async createCategory(data: CreateSignCategoryInput): Promise<SignCategoryItem> {
    return http.post<SignCategoryItem>(API_ENDPOINTS.CATALOG.CATEGORIES, data)
  }
}
