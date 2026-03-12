import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';

import { PrismaService } from '../prisma/prisma.service';
import { MetadataExtractorService } from './metadata-extractor.service';
import { SOLANA_CONNECTION } from './solana-connection.provider';

/**
 * Monitors active PM wallets via Solana WebSocket subscriptions (onLogs).
 * Subscribes on bootstrap, supports dynamic add/remove, and tears down
 * gracefully on module destroy.
 */
@Injectable()
export class WalletMonitorService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(WalletMonitorService.name);

  /** Maps wallet address → onLogs subscription ID. */
  private readonly activeSubscriptions = new Map<string, number>();

  constructor(
    @Inject(SOLANA_CONNECTION) private readonly connection: Connection,
    private readonly prisma: PrismaService,
    private readonly metadataExtractor: MetadataExtractorService,
  ) {}

  /** Returns the number of active subscriptions. */
  get subscriptionCount(): number {
    return this.activeSubscriptions.size;
  }

  /**
   * Lifecycle hook: bootstraps subscriptions for every active PM wallet
   * stored in the database.
   */
  async onApplicationBootstrap(): Promise<void> {
    const activeWallets = await this.prisma.user.findMany({
      where: { is_active: true },
      select: { wallet_address: true },
    });

    this.logger.log(
      `Bootstrapping subscriptions for ${activeWallets.length} active wallet(s)`,
    );

    for (const { wallet_address } of activeWallets) {
      this.subscribeToWallet(wallet_address);
    }
  }

  /**
   * Subscribes to on-chain log events for the given wallet address.
   * Idempotent — silently skips if already subscribed.
   *
   * @param address - The Solana wallet address (base-58) to monitor
   */
  subscribeToWallet(address: string): void {
    if (this.activeSubscriptions.has(address)) {
      this.logger.debug(`Already subscribed to wallet ${address}, skipping`);
      return;
    }

    const publicKey = new PublicKey(address);

    const subId = this.connection.onLogs(
      publicKey,
      (logs) => this.handleLogs(address, logs),
      'confirmed',
    );

    this.activeSubscriptions.set(address, subId);
    this.logger.log(`Subscribed to wallet ${address} (subId=${subId})`);
  }

  /**
   * Removes the WebSocket subscription for the given wallet address.
   * No-op if the address is not currently subscribed.
   *
   * @param address - The Solana wallet address to stop monitoring
   */
  async unsubscribeFromWallet(address: string): Promise<void> {
    const subId = this.activeSubscriptions.get(address);

    if (subId === undefined) {
      this.logger.debug(`No active subscription for wallet ${address}`);
      return;
    }

    await this.connection.removeOnLogsListener(subId);
    this.activeSubscriptions.delete(address);
    this.logger.log(`Unsubscribed from wallet ${address} (subId=${subId})`);
  }

  /**
   * Lifecycle hook: tears down all active subscriptions to prevent
   * memory leaks on application shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log(
      `Tearing down ${this.activeSubscriptions.size} subscription(s)`,
    );

    const teardownPromises: Promise<void>[] = [];

    for (const [address, subId] of this.activeSubscriptions) {
      teardownPromises.push(
        this.connection.removeOnLogsListener(subId).then(() => {
          this.logger.debug(`Removed listener for ${address} (subId=${subId})`);
        }),
      );
    }

    await Promise.all(teardownPromises);
    this.activeSubscriptions.clear();
  }

  /**
   * Internal handler invoked by each onLogs subscription.
   * Drops failed transactions and forwards successful signatures
   * to the MetadataExtractorService.
   */
  private handleLogs(
    address: string,
    logs: { err: unknown; signature: string },
  ): void {
    try {
      if (logs.err !== null) {
        this.logger.debug(
          `Dropping failed tx ${logs.signature} for wallet ${address}`,
        );
        return;
      }

      this.metadataExtractor.processSignature(logs.signature);
    } catch (error) {
      // Background context — no HTTP exception filter.
      // Log and continue to keep the subscription alive.
      this.logger.error(`Error handling logs for wallet ${address}: ${error}`);
    }
  }
}
