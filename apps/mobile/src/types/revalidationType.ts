import type { SignCategory } from '@/constants/sign-categories';

export type TaskPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type TaskStatus = 'OPEN' | 'EVALUATING' | 'CLOSED' | 'EXPIRED';

export interface RevalidationTaskItem {
  id: string;
  verifiedSignId: string;
  code: string;
  name: string;
  roadName?: string;
  category: SignCategory;
  priority: TaskPriority;
  status: TaskStatus;
  staleDays: number;
  latitude: number;
  longitude: number;
  historicalCropUrl?: string;
  representativeUrl?: string;
  lastVerifiedDate?: string;
  currentTrustScore?: number;
  reason: string;
  rewardCredits: number;
}

export type FindTasksInBoundsParams = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  page?: number;
  pageSize?: number;
};

export type RevalidationTasksInBoundsResponse = {
  items: Array<{
    id: string;
    verified_sign_id?: string;
    verifiedSignId?: string;
    status: string;
    priority: string;
    reason?: string;
    reward_credits?: number;
    rewardCredits?: number;
    latitude: number;
    longitude: number;
    sign_crop_url?: string;
    signCropUrl?: string;
    sign_code?: string;
    signCode?: string;
    name_en?: string;
    nameEn?: string;
    name_vi?: string;
    nameVi?: string;
    freshness_score?: number;
    freshnessScore?: number;
    created_at?: string;
    createdAt?: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type RevalidationFilterPriority = 'ALL' | TaskPriority;
export type RevalidationFilterCategory = 'ALL' | SignCategory;

export interface RevalidationFilterState {
  priority: RevalidationFilterPriority;
  category: RevalidationFilterCategory;
  searchQuery: string;
}
