import { Injectable, Logger } from '@nestjs/common';

/**
 * Stub service for transaction metadata extraction.
 * Full implementation deferred to TICKET-007.
 */
@Injectable()
export class MetadataExtractorService {
  private readonly logger = new Logger(MetadataExtractorService.name);

  /**
   * Processes a confirmed transaction signature.
   * Currently a no-op stub that logs the signature.
   *
   * @param signature - The Solana transaction signature to process
   */
  processSignature(signature: string): void {
    this.logger.log(`[STUB] Received signature for processing: ${signature}`);
  }
}
