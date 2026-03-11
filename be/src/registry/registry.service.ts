import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePMDto } from './dto/create-pm.dto';
import {
  CreatePMResponse,
  CurrencyListItem,
  RegistryListItem,
} from './interfaces/registry-response.interface';

/**
 * Service responsible for managing the Project Manager registry.
 * Handles PM creation with automatic role assignment and listing.
 */
@Injectable()
export class RegistryService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Creates a new Project Manager registration.
   * Automatically assigns the 'USER' role from the Role table.
   *
   * @param dto - The validated PM creation payload
   * @returns Success response with the new PM's id and is_active status
   * @throws NotFoundException if the 'USER' role does not exist in the database
   */
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

    return {
      status: 'success',
      message: 'PM successfully registered.',
      data: user,
    };
  }
}
