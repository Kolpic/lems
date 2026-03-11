import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * PrismaService provides database access throughout the application.
 * Extends PrismaClient to inherit all generated query methods.
 * Uses the Prisma 7 driver adapter pattern for PostgreSQL connectivity.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl = new URL(process.env.DATABASE_URL!);
    const pool = new pg.Pool({
      host: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.slice(1),
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  /** Connects to the database when the module initializes. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Disconnects from the database when the application shuts down. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
