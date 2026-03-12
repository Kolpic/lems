import { Test, TestingModule } from '@nestjs/testing';
import type { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

import { PrismaService } from '../prisma/prisma.service';
import { MetadataExtractorService } from './metadata-extractor.service';
import { SOLANA_CONNECTION } from './solana-connection.provider';
import { WalletMonitorService } from './wallet-monitor.service';

/** Generate a valid base58-encoded Solana address from a deterministic seed byte. */
const validAddress = (seed: number): string =>
  new PublicKey(Buffer.alloc(32, seed)).toBase58();

/**
 * Unit tests for WalletMonitorService.
 * Covers bootstrap, dynamic subscription, error filtering, and teardown.
 */
describe('WalletMonitorService', () => {
  let service: WalletMonitorService;
  let mockConnection: jest.Mocked<
    Pick<Connection, 'onLogs' | 'removeOnLogsListener'>
  >;
  let mockPrisma: { user: { findMany: jest.Mock } };
  let mockMetadataExtractor: jest.Mocked<MetadataExtractorService>;

  beforeEach(async () => {
    mockConnection = {
      onLogs: jest.fn().mockReturnValue(1),
      removeOnLogsListener: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockMetadataExtractor = {
      processSignature: jest.fn(),
    } as unknown as jest.Mocked<MetadataExtractorService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletMonitorService,
        { provide: SOLANA_CONNECTION, useValue: mockConnection },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MetadataExtractorService, useValue: mockMetadataExtractor },
      ],
    }).compile();

    service = module.get<WalletMonitorService>(WalletMonitorService);
  });

  // ── Test Case 1: Service Bootstrapping ──────────────────────────────────
  describe('onApplicationBootstrap', () => {
    it('should subscribe to all active PM wallets from the database', async () => {
      const wallets = [
        { wallet_address: validAddress(1) },
        { wallet_address: validAddress(2) },
      ];
      mockPrisma.user.findMany.mockResolvedValue(wallets);

      // Return distinct subscription IDs
      mockConnection.onLogs.mockReturnValueOnce(100).mockReturnValueOnce(101);

      await service.onApplicationBootstrap();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        select: { wallet_address: true },
      });
      expect(mockConnection.onLogs).toHaveBeenCalledTimes(2);
      expect(service.subscriptionCount).toBe(2);
    });
  });

  // ── Test Case 2: Dynamic Subscription ───────────────────────────────────
  describe('subscribeToWallet', () => {
    it('should create a new subscription and track it in the internal map', () => {
      const address = validAddress(3);
      mockConnection.onLogs.mockReturnValue(42);

      service.subscribeToWallet(address);

      expect(mockConnection.onLogs).toHaveBeenCalledTimes(1);

      // Verify the first argument is a PublicKey matching the address

      const calledPubKey: PublicKey = mockConnection.onLogs.mock.calls[0][0];
      expect(calledPubKey.toBase58()).toBe(address);
      expect(mockConnection.onLogs.mock.calls[0][2]).toBe('confirmed');

      expect(service.subscriptionCount).toBe(1);
    });

    it('should be idempotent — skip if already subscribed', () => {
      const address = validAddress(3);
      mockConnection.onLogs.mockReturnValue(42);

      service.subscribeToWallet(address);
      service.subscribeToWallet(address);

      expect(mockConnection.onLogs).toHaveBeenCalledTimes(1);
      expect(service.subscriptionCount).toBe(1);
    });
  });

  // ── Test Case 3: Error Filtering ────────────────────────────────────────
  describe('handleLogs (via onLogs callback)', () => {
    it('should drop failed transactions and not call processSignature', () => {
      const address = validAddress(4);
      mockConnection.onLogs.mockReturnValue(55);

      service.subscribeToWallet(address);

      // Extract the callback passed to onLogs
      const callback = mockConnection.onLogs.mock.calls[0][1] as (logs: {
        err: unknown;
        signature: string;
      }) => void;

      // Simulate a failed on-chain transaction
      callback({
        err: { InstructionError: [0, 'Custom'] },
        signature: 'failedSig123',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock assertion requires unbound reference
      expect(mockMetadataExtractor.processSignature).not.toHaveBeenCalled();
    });

    it('should forward successful transaction signatures to MetadataExtractorService', () => {
      const address = validAddress(4);
      mockConnection.onLogs.mockReturnValue(55);

      service.subscribeToWallet(address);

      const callback = mockConnection.onLogs.mock.calls[0][1] as (logs: {
        err: unknown;
        signature: string;
      }) => void;

      // Simulate a successful on-chain transaction
      callback({ err: null, signature: 'successSig456' });

      // eslint-disable-next-line @typescript-eslint/unbound-method -- Jest mock assertion requires unbound reference
      expect(mockMetadataExtractor.processSignature).toHaveBeenCalledWith(
        'successSig456',
      );
    });
  });

  // ── Test Case 4: Graceful Teardown ──────────────────────────────────────
  describe('onModuleDestroy', () => {
    it('should remove all listeners and clear the subscription map', async () => {
      mockConnection.onLogs.mockReturnValueOnce(10).mockReturnValueOnce(20);

      service.subscribeToWallet(validAddress(5));
      service.subscribeToWallet(validAddress(6));
      expect(service.subscriptionCount).toBe(2);

      await service.onModuleDestroy();

      expect(mockConnection.removeOnLogsListener).toHaveBeenCalledWith(10);
      expect(mockConnection.removeOnLogsListener).toHaveBeenCalledWith(20);
      expect(mockConnection.removeOnLogsListener).toHaveBeenCalledTimes(2);
      expect(service.subscriptionCount).toBe(0);
    });
  });
});
