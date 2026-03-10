import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RegistryService } from './registry.service';
import { CreatePMDto } from './dto/create-pm.dto';
import {
  CreatePMResponse,
  RegistryListItem,
} from './interfaces/registry-response.interface';

/**
 * Controller for the PM Registry API.
 * All endpoints require ADMIN role authentication.
 *
 * @route /api/v1/registry
 */
@Controller('registry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  /**
   * Fetches all registered project managers.
   *
   * @returns Array of PM records with target_balance, is_active, and currency info
   */
  @Get()
  async findAll(): Promise<RegistryListItem[]> {
    return this.registryService.findAll();
  }

  /**
   * Registers a new project manager.
   *
   * @param dto - The validated PM creation payload
   * @returns Success response with created PM id and is_active status
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPM(@Body() dto: CreatePMDto): Promise<CreatePMResponse> {
    return this.registryService.createPM(dto);
  }
}
