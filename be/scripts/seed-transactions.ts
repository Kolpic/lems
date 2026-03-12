/**
 * Seeds the database with 10,000 dummy transactions for performance testing.
 *
 * Usage: npx tsx be/scripts/seed-transactions.ts
 *
 * After running, verify index usage with:
 *   EXPLAIN ANALYZE
 *   SELECT * FROM "Transaction"
 *   WHERE pm_id = '<uuid>'
 *   ORDER BY block_time DESC
 *   LIMIT 20;
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const BATCH_SIZE = 500;
const TOTAL_TRANSACTIONS = 10_000;
const MERCHANTS = [
  'AWS Services',
  'Google Cloud',
  'Hetzner',
  'DigitalOcean',
  'Vercel',
  'GitHub',
  'Figma',
  'Notion',
  'Slack',
  'Linear',
];

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL!);
  const pool = new pg.Pool({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.slice(1),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  const firstUser = await prisma.user.findFirst({ select: { id: true } });
  if (!firstUser) {
    console.error('No users found. Create at least one PM before seeding transactions.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const firstCurrency = await prisma.currency.findFirst({ select: { id: true } });
  if (!firstCurrency) {
    console.error('No currencies found. Seed currencies before seeding transactions.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const pmId = firstUser.id;
  const currencyId = firstCurrency.id;
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  console.log(`Seeding ${TOTAL_TRANSACTIONS} transactions for PM ${pmId}...`);
  const start = performance.now();

  for (let batch = 0; batch < TOTAL_TRANSACTIONS / BATCH_SIZE; batch++) {
    const records = Array.from({ length: BATCH_SIZE }, (_, i) => {
      const idx = batch * BATCH_SIZE + i;
      const blockTime = new Date(now - Math.random() * ninetyDaysMs);
      return {
        signature: `fake-sig-${idx}-${now}`,
        type: Math.random() > 0.5 ? 'REFILL' as const : 'SPEND' as const,
        merchant_name: MERCHANTS[idx % MERCHANTS.length],
        amount: parseFloat((Math.random() * 500 + 1).toFixed(2)),
        status: 'COMPLETED' as const,
        block_time: blockTime,
        pm_id: pmId,
        currency_id: currencyId,
      };
    });

    await prisma.transaction.createMany({ data: records });
    console.log(`  Inserted batch ${batch + 1}/${TOTAL_TRANSACTIONS / BATCH_SIZE}`);
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);
  console.log(`Done. ${TOTAL_TRANSACTIONS} transactions seeded in ${elapsed}s.`);
  console.log(`\nRun EXPLAIN ANALYZE to verify index usage:`);
  console.log(`  SELECT * FROM "Transaction" WHERE pm_id = '${pmId}' ORDER BY block_time DESC LIMIT 20;`);

  await prisma.$disconnect();
}

void main();
