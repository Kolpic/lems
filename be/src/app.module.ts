import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegistryModule } from './registry/registry.module';

@Module({
  imports: [PrismaModule, AuthModule, RegistryModule, BlockchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
