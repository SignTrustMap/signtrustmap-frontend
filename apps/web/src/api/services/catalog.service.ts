import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { env } from '@/config/env'

export interface BackendSignCategory {
  id: number
  code: string
  nameVi: string
  nameEn: string
  description?: string | null
  iconUrl?: string | null
  sortOrder?: number
}

export interface BackendCatalogSignType {
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
  allowedVehicles?: string[]
  representativeImageKey?: string | null
  aiLabelPrompt?: string | null
  osmMapping?: string | null
  category?: BackendSignCategory
}

export interface BackendPageResponse<T> {
  content?: T[]
  items?: T[]
  total?: number
  totalElements?: number
  page?: number
  size?: number
  totalPages?: number
}

export interface ListSignTypesParams {
  categoryId?: number
  isActive?: boolean
  search?: string
  page?: number
  size?: number
}

export interface ProposeMissingTypeDto {
  proposedName: string
  proposedCategoryId?: number
  suggestedShape?: string
  suggestedColorScheme?: string
  description?: string
  candidateId?: string
}

/**
 * Ensures an active access token is present before catalog requests.
 * If user is browsing as guest, silently retrieves a demo token so public catalog can be read.
 */
async function ensureAuthToken(): Promise<void> {
  const token = localStorage.getItem('stm_access_token') || sessionStorage.getItem('stm_access_token')
  if (!token) {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@stm.dev', password: 'Demo@123' }),
      })
      if (res.ok) {
        const data = await res.json()
        const guestToken = data.accessToken || data.token
        if (guestToken) {
          localStorage.setItem('stm_access_token', guestToken)
        }
      }
    } catch {
      // Continue even if login attempt fails
    }
  }
}

export const catalogService = {
  /**
   * Fetch all official traffic sign categories from NestJS backend
   */
  getCategories: async (): Promise<BackendSignCategory[]> => {
    await ensureAuthToken()
    const res = await apiClient.get<any, BackendSignCategory[]>(API_ENDPOINTS.CATALOG.CATEGORIES)
    if (Array.isArray(res)) {
      return res.filter((c) => c.code !== 'MOCK_TRAFFIC_SIGNS')
    }
    return []
  },

  /**
   * Fetch traffic sign types from NestJS backend with pagination & search
   */
  getSignTypes: async (params?: ListSignTypesParams): Promise<{
    items: BackendCatalogSignType[]
    total: number
    page: number
    size: number
    totalPages: number
  }> => {
    await ensureAuthToken()
    const query = new URLSearchParams()
    if (params?.categoryId) query.set('categoryId', String(params.categoryId))
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))
    if (params?.search) query.set('search', params.search)
    if (params?.page !== undefined) query.set('page', String(params.page))
    // Backend strictly enforces size <= 100 via @Max(100) validation
    const clampedSize = params?.size ? Math.min(100, Math.max(1, params.size)) : 100
    query.set('size', String(clampedSize))

    const qs = query.toString() ? `?${query.toString()}` : ''
    const res = await apiClient.get<any, BackendPageResponse<BackendCatalogSignType>>(
      `${API_ENDPOINTS.CATALOG.SIGN_TYPES}${qs}`
    )

    const list = res?.content || res?.items || (Array.isArray(res) ? res : [])
    const total = res?.totalElements ?? res?.total ?? list.length
    const page = res?.page ?? 0
    const size = res?.size ?? list.length
    const totalPages = res?.totalPages ?? Math.ceil(total / Math.max(1, size))

    return {
      items: list,
      total,
      page,
      size,
      totalPages,
    }
  },

  /**
   * Fetch ALL official traffic signs from NestJS backend across all pages.
   * Smoothly aggregates paginated batches (size=100) into a single unified array.
   */
  getAllSignTypes: async (params?: Omit<ListSignTypesParams, 'page' | 'size'>): Promise<{
    items: BackendCatalogSignType[]
    total: number
  }> => {
    // 1. Fetch initial batch (page 0)
    const firstPage = await catalogService.getSignTypes({
      ...params,
      page: 0,
      size: 100,
    })

    const allItems: BackendCatalogSignType[] = [...firstPage.items]
    const total = firstPage.total
    const totalPages = firstPage.totalPages

    // 2. If there are remaining pages, fetch concurrently
    if (totalPages > 1) {
      const remainingPromises: ReturnType<typeof catalogService.getSignTypes>[] = []
      for (let p = 1; p < totalPages; p++) {
        remainingPromises.push(
          catalogService.getSignTypes({
            ...params,
            page: p,
            size: 100,
          })
        )
      }

      const results = await Promise.all(remainingPromises)
      for (const res of results) {
        if (res.items && res.items.length > 0) {
          allItems.push(...res.items)
        }
      }
    }

    return {
      items: allItems,
      total,
    }
  },

  /**
   * Get single traffic sign type by ID
   */
  getSignTypeById: async (id: number | string): Promise<BackendCatalogSignType> => {
    await ensureAuthToken()
    return apiClient.get<any, BackendCatalogSignType>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id))
  },

  /**
   * Submit a missing / novel traffic sign report for moderation review
   */
  proposeNewSign: async (dto: ProposeMissingTypeDto): Promise<{ success: boolean; reportId?: string }> => {
    await ensureAuthToken()
    return apiClient.post(API_ENDPOINTS.CATALOG.PROPOSE_NEW, dto)
  },

  // Backward compatibility
  getCatalog: (category?: string) => {
    return catalogService.getSignTypes({ search: category, size: 100 })
  },
}
