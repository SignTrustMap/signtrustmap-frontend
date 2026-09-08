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

export async function getCatalog(accessToken: string) {
  const [categories, signTypes] = await Promise.all([
    apiRequest<CatalogCategory[]>('/catalog/categories', {}, accessToken),
    apiRequest<PageResponse<CatalogSign>>('/catalog/sign-types?size=100', {}, accessToken),
  ]);
  return { categories, signs: signTypes.content };
}
