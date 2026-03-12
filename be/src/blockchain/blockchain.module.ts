import { Module } from '@nestjs/common';

import { MetadataExtractorService } from './metadata-extractor.service';
import { solanaConnectionProvider } from './solana-connection.provider';
import { WalletMonitorService } from './wallet-monitor.service';

/**
 * Encapsulates all Solana blockchain interactions: RPC connection,
 * WebSocket monitoring, and transaction metadata extraction.
 */
@Module({
  providers: [
    solanaConnectionProvider,
    MetadataExtractorService,
    WalletMonitorService,
  ],
  exports: [WalletMonitorService],
})
export class BlockchainModule {}
