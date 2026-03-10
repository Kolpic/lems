import { Module } from '@nestjs/common';
import { RegistryController } from './registry.controller';
import { RegistryService } from './registry.service';

/**
 * Module encapsulating the PM Registry feature.
 * PrismaService is available via the global PrismaModule.
 */
@Module({
  controllers: [RegistryController],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}
