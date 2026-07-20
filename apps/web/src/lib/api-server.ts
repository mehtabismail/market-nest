import type { BuyerProductDTO, BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchProducts(params?: {
  categoryId?: string;
  search?: string;
  semantic?: boolean;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.categoryId) q.set('categoryId', params.categoryId);
  if (params?.search) q.set('search', params.search);
  if (params?.semantic) q.set('semantic', 'true');
  if (params?.page) q.set('page', String(params.page));

  return safeFetch<{
    items: BuyerProductListItemDTO[];
    total: number;
    page: number;
    limit: number;
    searchMode?: string;
  }>(`${API_URL}/api/v1/products?${q}`, { items: [], total: 0, page: 1, limit: 20 });
}

export async function fetchProduct(id: string): Promise<BuyerProductDTO | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<BuyerProductDTO>;
  } catch {
    return null;
  }
}

export async function fetchCategories() {
  return safeFetch<{ id: string; name: string; slug: string; parentId: string | null }[]>(
    `${API_URL}/api/v1/categories`,
    [],
  );
}

export async function fetchFeatured() {
  return safeFetch<
    {
      product: {
        id: string;
        title: string;
        price: string | number;
        images: string[];
        ownerType: string;
        status: string;
      };
    }[]
  >(`${API_URL}/api/v1/featured`, []);
}

export interface BannerDTO {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  activeFrom: string | null;
  activeUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function fetchBanners() {
  return safeFetch<BannerDTO[]>(`${API_URL}/api/v1/banners`, []);
}
