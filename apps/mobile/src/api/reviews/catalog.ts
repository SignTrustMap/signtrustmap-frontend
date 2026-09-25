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
  const [categories, firstPage] = await Promise.all([
    apiRequest<CatalogCategory[]>('/catalog/categories', { signal }, accessToken),
    apiRequest<PageResponse<CatalogSign>>('/catalog/sign-types?page=0&size=100', { signal }, accessToken),
  ]);

  let allSigns = [...firstPage.content];
  if (firstPage.totalPages > 1) {
    const extraPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
        apiRequest<PageResponse<CatalogSign>>(`/catalog/sign-types?page=${i + 1}&size=100`, { signal }, accessToken)
      )
    );
    for (const p of extraPages) {
      allSigns = allSigns.concat(p.content);
    }
  }

  return { categories, signs: allSigns };
}
