import Link from 'next/link';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types/buyer';
import { fetchBanners, fetchCategories, fetchFeatured, fetchProducts } from '@/lib/api-server';
import { AnimatedHero } from '@/components/shop/animated-hero';
import { AnimatedCategories } from '@/components/shop/animated-categories';
import { AnimatedBannerCarousel } from '@/components/shop/animated-banner-carousel';
import { AnimatedProductGrid } from '@/components/shop/animated-product-grid';

export const revalidate = 60;

function mapFeatured(
  rows: Awaited<ReturnType<typeof fetchFeatured>>,
): BuyerProductListItemDTO[] {
  return rows
    .filter((r) => r.product?.status === 'published')
    .map((r) => {
      const images = Array.isArray(r.product.images) ? r.product.images : [];
      return {
        id: r.product.id,
        title: r.product.title,
        price: Number(r.product.price),
        comparePrice: null,
        thumbnail: images[0] ?? null,
        isMarketNestOfficial: r.product.ownerType === 'platform_owned',
      };
    });
}

export default async function BuyerHomePage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const categorySlug = searchParams?.category?.trim();
  const categories = await fetchCategories();
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  const [{ items }, featured, banners] = await Promise.all([
    fetchProducts(activeCategory ? { categoryId: activeCategory.id } : undefined),
    fetchFeatured(),
    fetchBanners(),
  ]);

  const featuredItems = featured.length ? mapFeatured(featured) : items.slice(0, 4);
  const showFeatured = !activeCategory;

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <AnimatedHero />

      {categories.length > 0 && (
        <AnimatedCategories categories={categories} activeSlug={categorySlug} />
      )}

      {activeCategory && (
        <div className="mb-6 flex flex-wrap items-center gap-3 shop-reveal">
          <p className="text-sm text-mn-mid">
            Showing products in <span className="font-semibold text-mn-ink">{activeCategory.name}</span>
          </p>
          <Link href="/shop" className="text-sm font-semibold text-mn-teal hover:text-mn-accent">
            Clear filter
          </Link>
        </div>
      )}

      {banners.length > 0 && !activeCategory && (
        <AnimatedBannerCarousel banners={banners} />
      )}

      {showFeatured && (
        <AnimatedProductGrid
          title="Featured this week"
          products={featuredItems}
          showSeeMore
        />
      )}

      <AnimatedProductGrid
        title={activeCategory ? `${activeCategory.name} products` : 'All products'}
        products={items}
        emptyMessage={
          activeCategory
            ? `No published products in ${activeCategory.name} yet.`
            : 'No products yet. Add published products via the seller or admin portal.'
        }
        columns={4}
      />
    </main>
  );
}
