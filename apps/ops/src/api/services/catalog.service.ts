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

export interface PaginatedSignTypesResponse {
  items: CatalogSignTypeItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListSignTypesParams {
  categoryId?: number
  isActive?: boolean
  search?: string
  q?: string
  page?: number
  size?: number
  pageSize?: number
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

export interface UpdateSignTypeInput extends Partial<CreateSignTypeInput> {}

export interface CreateSignCategoryInput {
  code: string
  nameVi: string
  nameEn: string
  description?: string
  iconUrl?: string
  sortOrder?: number
}

export interface UpdateSignCategoryInput extends Partial<CreateSignCategoryInput> {}

export interface CandidateEnriched {
  id: string
  predictedSignTypeId?: number
  confidenceScore?: number
  bestFrameUrl?: string
  signCropUrl?: string
  status?: string
  latitude?: number
  longitude?: number
}

export interface MissingTypeReportItem {
  id: string
  reporterId?: string
  submittedBy?: string
  candidateId?: string | null
  originalCandidateId?: string | null
  proposedCategoryId?: number | null
  proposedName: string
  suggestedNameVi?: string | null
  suggestedNameEn?: string | null
  suggestedCode?: string | null
  description?: string | null
  suggestedShape?: string | null
  suggestedColorScheme?: string | null
  cropImageUrl?: string | null
  status: 'PENDING' | 'MERGED' | 'ESCALATED_ADMIN' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE' | 'IN_REVIEW'
  mergedIntoSignTypeId?: number | null
  reviewedBy?: string | null
  staffNotes?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
  candidate?: CandidateEnriched | null
}

export interface PaginatedMissingReportsResponse {
  items: MissingTypeReportItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApproveAndCreateSignTypeInput {
  proposedCategoryId?: number
  categoryId?: number
  signCode?: string
  nameVi?: string
  nameEn?: string
  description?: string
  suggestedShape?: string
  shape?: string
  suggestedColorScheme?: string
  colorScheme?: string
  aiLabelPrompt?: string
  staffNotes?: string
  representativeImageKey?: string
}

export const catalogService = {
  // ── Categories ──────────────────────────────────────────────────
  getCategories: async (): Promise<SignCategoryItem[]> => {
    const res = await http.get<SignCategoryItem[]>(API_ENDPOINTS.CATALOG.CATEGORIES)
    if (Array.isArray(res)) {
      return res.filter(
        (c) =>
          !c.code?.toLowerCase().includes('mock') &&
          !c.nameVi?.toLowerCase().includes('mock') &&
          !c.nameEn?.toLowerCase().includes('mock')
      )
    }
    return []
  },

  getCategoryById: async (id: number): Promise<SignCategoryItem> => {
    return http.get<SignCategoryItem>(API_ENDPOINTS.CATALOG.CATEGORY_DETAIL(id))
  },

  createCategory: async (data: CreateSignCategoryInput): Promise<SignCategoryItem> => {
    return http.post<SignCategoryItem>(API_ENDPOINTS.CATALOG.CATEGORIES, data)
  },

  updateCategory: async (id: number, data: UpdateSignCategoryInput): Promise<SignCategoryItem> => {
    return http.patch<SignCategoryItem>(API_ENDPOINTS.CATALOG.CATEGORY_DETAIL(id), data)
  },

  deleteCategory: async (id: number): Promise<{ deleted: boolean; id: number }> => {
    return http.delete<{ deleted: boolean; id: number }>(API_ENDPOINTS.CATALOG.CATEGORY_DETAIL(id))
  },

  // ── Sign Types ──────────────────────────────────────────────────
  getSignTypes: async (params?: ListSignTypesParams): Promise<PaginatedSignTypesResponse> => {
    const q: Record<string, any> = {}
    if (params?.categoryId) q.categoryId = params.categoryId
    if (params?.isActive !== undefined) q.isActive = params.isActive
    if (params?.search || params?.q) q.search = params.search || params.q
    if (params?.page !== undefined) q.page = params.page
    const clampedSize = params?.size || params?.pageSize ? Math.min(100, Math.max(1, (params?.size || params?.pageSize)!)) : 100
    q.size = clampedSize

    const res = await http.get<any>(API_ENDPOINTS.CATALOG.SIGN_TYPES, { params: q })
    const items: CatalogSignTypeItem[] = res?.content || res?.items || (Array.isArray(res) ? res : [])
    const total: number = res?.totalElements ?? res?.total ?? items.length
    const page: number = res?.page ?? 0
    const pageSize: number = res?.size ?? clampedSize
    const totalPages: number = res?.totalPages ?? Math.ceil(total / Math.max(1, pageSize))

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    }
  },

  getAllSignTypes: async (params?: Omit<ListSignTypesParams, 'page' | 'size' | 'pageSize'>): Promise<{
    items: CatalogSignTypeItem[]
    total: number
  }> => {
    const firstPage = await catalogService.getSignTypes({ ...params, page: 0, size: 100 })
    const all = [...(firstPage.items || [])]
    const total = firstPage.total || all.length
    const totalPages = firstPage.totalPages || Math.ceil(total / 100)

    if (totalPages > 1) {
      const remainingPromises = []
      for (let p = 1; p < totalPages; p++) {
        remainingPromises.push(
          catalogService.getSignTypes({ ...params, page: p, size: 100 }).catch(() => ({ items: [] }))
        )
      }
      const rest = await Promise.all(remainingPromises)
      rest.forEach((batch) => {
        if (batch.items && batch.items.length > 0) {
          all.push(...batch.items)
        }
      })
    }

    return { items: all, total }
  },

  getSignTypeById: async (id: number): Promise<CatalogSignTypeItem> => {
    return http.get<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id))
  },

  createSignType: async (data: CreateSignTypeInput | FormData): Promise<CatalogSignTypeItem> => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    return http.post<CatalogSignTypeItem>(
      API_ENDPOINTS.CATALOG.SIGN_TYPES,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    )
  },

  updateSignType: async (id: number, data: UpdateSignTypeInput | FormData): Promise<CatalogSignTypeItem> => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    return http.patch<CatalogSignTypeItem>(
      API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id),
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    )
  },

  deleteSignType: async (id: number): Promise<{ deleted: boolean; id: number }> => {
    return http.delete<{ deleted: boolean; id: number }>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id))
  },

  // ── Missing Sign Type Reports (Moderation) ──────────────────────
  getMissingReports: async (params?: { status?: string; page?: number; pageSize?: number }): Promise<PaginatedMissingReportsResponse> => {
    return http.get<PaginatedMissingReportsResponse>(API_ENDPOINTS.MODERATION.MISSING_TYPE_REPORTS, { params })
  },

  getMissingReportById: async (id: string): Promise<MissingTypeReportItem> => {
    return http.get<MissingTypeReportItem>(API_ENDPOINTS.MODERATION.MISSING_TYPE_REPORT_DETAIL(id))
  },

  updateMissingReport: async (
    id: string,
    data: {
      status?: string
      staffNotes?: string
      actionNote?: string
      mergedSignTypeId?: number
      mergedIntoSignTypeId?: number
      suggestedShape?: string
      suggestedColorScheme?: string
    }
  ): Promise<MissingTypeReportItem> => {
    return http.patch<MissingTypeReportItem>(API_ENDPOINTS.MODERATION.MISSING_TYPE_REPORT_DETAIL(id), data)
  },

  requestCandidateRecapture: async (
    candidateId: string,
    data: { reason: string; note?: string }
  ): Promise<{ success: boolean; requestId?: string; message?: string }> => {
    return http.post(API_ENDPOINTS.MODERATION.REQUEST_RECAPTURE(candidateId), data)
  },

  approveAndCreateType: async (
    id: string,
    data: ApproveAndCreateSignTypeInput | FormData,
    file?: File
  ): Promise<{ message?: string; report?: MissingTypeReportItem; createdSignType?: CatalogSignTypeItem; signType?: CatalogSignTypeItem }> => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    if (isFormData) {
      return http.post(
        API_ENDPOINTS.MODERATION.APPROVE_AND_CREATE_TYPE(id),
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
    }
    if (file) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          formData.append(key, String(val))
        }
      })
      formData.append('file', file)
      return http.post(
        API_ENDPOINTS.MODERATION.APPROVE_AND_CREATE_TYPE(id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
    }
    return http.post(
      API_ENDPOINTS.MODERATION.APPROVE_AND_CREATE_TYPE(id),
      data
    )
  },

  reprocessCandidates: async (
    signTypeId: number,
    similarityThreshold = 0.70
  ): Promise<{ message: string; reprocessedCount: number }> => {
    return http.post<{ message: string; reprocessedCount: number }>(
      API_ENDPOINTS.CATALOG.REPROCESS(signTypeId),
      { similarityThreshold }
    )
  },

  // ── Support Shots & Prototypes ──────────────────────────────────
  getSupportShots: async (signTypeId: number): Promise<any[]> => {
    return http.get<any[]>(API_ENDPOINTS.CATALOG.SUPPORT_SHOTS(signTypeId))
  },

  addSupportShot: async (signTypeId: number, data: any): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.CATALOG.SUPPORT_SHOTS(signTypeId), data)
  },

  deleteSupportShot: async (signTypeId: number, imageId: string): Promise<any> => {
    return http.delete<any>(API_ENDPOINTS.CATALOG.SUPPORT_SHOT_DETAIL(signTypeId, imageId))
  },

  togglePinSupportShot: async (signTypeId: number, imageId: string, isPinned: boolean): Promise<any> => {
    return http.patch<any>(API_ENDPOINTS.CATALOG.SUPPORT_SHOT_PIN(signTypeId, imageId), { isPinned })
  },

  rebuildPrototypes: async (): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.CATALOG.REBUILD_PROTOTYPES)
  },

  // ── Backward Compatibility Helpers ──────────────────────────────
  getCatalog: async (params?: any): Promise<any> => {
    return catalogService.getSignTypes(params)
  },
  createSign: async (data: any): Promise<any> => {
    return catalogService.createSignType(data)
  },
  getMissingSignReports: async (): Promise<any> => {
    return catalogService.getMissingReports()
  },
  approveMissingReport: async (reportId: string, data?: any): Promise<any> => {
    return catalogService.updateMissingReport(reportId, { status: 'APPROVED', staffNotes: data?.catalogCode })
  },
  mergeMissingReport: async (reportId: string, targetCatalogCode: string): Promise<any> => {
    return catalogService.updateMissingReport(reportId, { status: 'APPROVED', staffNotes: `Merged to ${targetCatalogCode}` })
  },
}

export const CatalogService = catalogService
