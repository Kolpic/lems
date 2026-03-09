import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService provides database access throughout the application.
 * Extends PrismaClient to inherit all generated query methods.
 * Manages connection lifecycle via NestJS module hooks.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /** Connects to the database when the module initializes. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Disconnects from the database when the application shuts down. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
