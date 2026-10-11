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

export interface MissingTypeReportItem {
  id: string
  submittedBy: string
  originalCandidateId?: string | null
  suggestedCode?: string | null
  suggestedNameVi?: string | null
  suggestedNameEn?: string | null
  cropImageUrl?: string | null
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
  staffNotes?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedMissingReportsResponse {
  items: MissingTypeReportItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApproveAndCreateSignTypeInput {
  categoryId: number
  signCode: string
  nameVi: string
  nameEn: string
  description?: string
  shape?: string
  colorScheme?: string
}

export const catalogService = {
  // ── Categories ──────────────────────────────────────────────────
  getCategories: async (): Promise<SignCategoryItem[]> => {
    return http.get<SignCategoryItem[]>(API_ENDPOINTS.CATALOG.CATEGORIES)
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
    if (params?.size || params?.pageSize) q.size = params.size || params.pageSize

    return http.get<PaginatedSignTypesResponse>(API_ENDPOINTS.CATALOG.SIGN_TYPES, { params: q })
  },

  getSignTypeById: async (id: number): Promise<CatalogSignTypeItem> => {
    return http.get<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id))
  },

  createSignType: async (data: CreateSignTypeInput): Promise<CatalogSignTypeItem> => {
    return http.post<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPES, data)
  },

  updateSignType: async (id: number, data: UpdateSignTypeInput): Promise<CatalogSignTypeItem> => {
    return http.patch<CatalogSignTypeItem>(API_ENDPOINTS.CATALOG.SIGN_TYPE_DETAIL(id), data)
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

  updateMissingReport: async (id: string, data: { status?: string; staffNotes?: string }): Promise<MissingTypeReportItem> => {
    return http.patch<MissingTypeReportItem>(API_ENDPOINTS.MODERATION.MISSING_TYPE_REPORT_DETAIL(id), data)
  },

  approveAndCreateType: async (id: string, data: ApproveAndCreateSignTypeInput): Promise<{ message: string; signType: CatalogSignTypeItem }> => {
    return http.post<{ message: string; signType: CatalogSignTypeItem }>(
      API_ENDPOINTS.MODERATION.APPROVE_AND_CREATE_TYPE(id),
      data
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
