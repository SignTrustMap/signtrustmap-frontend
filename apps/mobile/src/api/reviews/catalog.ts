import { apiRequest } from '@/api/api-client';

export type CatalogCategory = {
  code: string;
  description: string | null;
  id: number;
  nameEn: string;
  nameVi: string;
};

export type CatalogSign = {
  category: CatalogCategory;
  categoryId: number;
  description: string | null;
  id: number;
  nameEn: string;
  nameVi: string;
  representativeImageKey: string | null;
  signCode: string;
};

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export async function getCatalog(accessToken: string, signal?: AbortSignal) {
  // Integration unclear: api/reviews/review has no catalog endpoints. Its
  // SignCategoryDto uses string IDs and optional descriptions, while this feature
  // uses numeric IDs and nullable descriptions. Keep these calls/types unchanged.
  const [categories, signTypes] = await Promise.all([
    apiRequest<CatalogCategory[]>('/catalog/categories', { signal }, accessToken),
    apiRequest<PageResponse<CatalogSign>>('/catalog/sign-types?size=100', { signal }, accessToken),
  ]);
  return { categories, signs: signTypes.content };
}
