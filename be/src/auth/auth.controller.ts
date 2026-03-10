import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifySignatureDto } from './dto/verify-signature.dto';

/**
 * Controller for wallet-based authentication.
 * This endpoint is public (no guards) — it issues JWT tokens
 * after verifying a cryptographic wallet signature.
 *
 * @route /api/v1/auth
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Verifies a wallet signature and returns a JWT access token.
   *
   * @param dto - The wallet address, message, and signature
   * @returns JWT access token and user profile
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifySignatureDto) {
    return this.authService.verifySignature(dto);
  }
}
