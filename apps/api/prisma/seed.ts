/**
 * Run: npx ts-node prisma/seed.ts (after creating super admin in Supabase Auth)
 * Or set SEED_SUPERADMIN_EMAIL + SEED_SUPERADMIN_PASSWORD and use Supabase Admin API.
 */
import { PrismaClient } from '@prisma/client';

const OFFICIAL_SELLER_ID = '00000000-0000-4000-8000-000000000001';

async function main() {
  const prisma = new PrismaClient();

  await prisma.seller.upsert({
    where: { storeSlug: 'marketnest-official' },
    create: {
      id: OFFICIAL_SELLER_ID,
      storeName: 'MarketNest Official',
      storeSlug: 'marketnest-official',
      description: 'Platform-owned inventory',
      isActive: true,
      isSystem: true,
      commissionRate: 0,
      status: 'active',
    },
    update: {},
  });

  const categories = [
    { name: 'Electronics', slug: 'electronics', sortOrder: 1 },
    { name: 'Fashion', slug: 'fashion', sortOrder: 2 },
    { name: 'Home & Garden', slug: 'home-garden', sortOrder: 3 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {},
    });
  }

  console.log('Seed complete: MarketNest Official + categories');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
