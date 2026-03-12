import { Injectable, NotFoundException } from '@nestjs/common';

import { WalletMonitorService } from '../blockchain/wallet-monitor.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePMDto } from './dto/create-pm.dto';
import { UpdateTargetBalanceDto } from './dto/update-target-balance.dto';
import {
  CreatePMResponse,
  CurrencyListItem,
  ProjectListItem,
  RegistryListItem,
  UpdateTargetResponse,
} from './interfaces/registry-response.interface';

/**
 * Service responsible for managing the Project Manager registry.
 * Handles PM creation with automatic role assignment and listing.
 * Triggers real-time wallet monitoring on new PM creation.
 */
@Injectable()
export class RegistryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletMonitor: WalletMonitorService,
  ) {}

  /**
   * Retrieves all registered project managers with their currency info.
   *
   * @returns Array of PM records including target_balance and is_active status
   */
  async findAll(): Promise<RegistryListItem[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        wallet_address: true,
        target_balance: true,
        is_active: true,
        project_id: true,
        created_at: true,
        currency: {
          select: {
            id: true,
            symbol: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      target_balance: user.target_balance.toString(),
    }));
  }

  /**
   * Retrieves all available currencies for PM allocation.
   *
   * @returns Array of currency records with id, symbol, and decimals
   */
  async findAllCurrencies(): Promise<CurrencyListItem[]> {
    return this.prisma.currency.findMany({
      select: {
        id: true,
        symbol: true,
        decimals: true,
      },
    });
  }

  /**
   * Retrieves all available projects for PM assignment.
   *
   * @returns Array of project records with id, name, start_date, and end_date
   */
  async findAllProjects(): Promise<ProjectListItem[]> {
    return this.prisma.project.findMany({
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
      },
    });
  }

  /**
   * Creates a new Project Manager registration.
   * Automatically assigns the 'USER' role from the Role table.
   *
   * @param dto - The validated PM creation payload
   * @returns Success response with the new PM's id and is_active status
   * @throws NotFoundException if the 'USER' role does not exist in the database
   */
  /**
   * Updates the target balance for an existing Project Manager.
   *
   * @param id - The UUID of the PM to update
   * @param dto - The validated update payload containing the new target_balance
   * @returns Success response with the updated target_balance as a string
   * @throws NotFoundException if no PM exists with the given id
   */
  async updateTargetBalance(
    id: string,
    dto: UpdateTargetBalanceDto,
  ): Promise<UpdateTargetResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`PM with id "${id}" not found.`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { target_balance: dto.target_balance },
      select: {
        id: true,
        target_balance: true,
      },
    });

    return {
      status: 'success',
      message: 'Target balance updated successfully.',
      data: {
        id: updated.id,
        target_balance: updated.target_balance.toString(),
      },
    };
  }

  async createPM(dto: CreatePMDto): Promise<CreatePMResponse> {
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (!userRole) {
      throw new NotFoundException(
        'Role "USER" not found. Please seed the database with required roles.',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        wallet_address: dto.wallet_address,
        target_balance: dto.target_balance,
        project_id: dto.project_id,
        currency_id: dto.currency_id,
        role_id: userRole.id,
      },
      select: {
        id: true,
        is_active: true,
      },
    });

    // Start monitoring the new PM wallet immediately (fire-and-forget).
    this.walletMonitor.subscribeToWallet(dto.wallet_address);

    return {
      status: 'success',
      message: 'PM successfully registered.',
      data: user,
    };
  }
}
