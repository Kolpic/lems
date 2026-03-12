import { Module } from '@nestjs/common';

import { BlockchainModule } from '../blockchain/blockchain.module';
import { RegistryController } from './registry.controller';
import { RegistryService } from './registry.service';

/**
 * Module encapsulating the PM Registry feature.
 * PrismaService is available via the global PrismaModule.
 * Imports BlockchainModule for dynamic wallet monitoring on PM creation.
 */
@Module({
  imports: [BlockchainModule],
  controllers: [RegistryController],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}
