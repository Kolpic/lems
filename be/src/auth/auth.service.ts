import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { PrismaService } from '../prisma/prisma.service';
import { VerifySignatureDto } from './dto/verify-signature.dto';

/** Shape of the JWT payload stored in the token. */
interface JwtPayload {
  readonly sub: string;
  readonly wallet_address: string;
  readonly role: string;
}

/** Shape of the authentication response returned to the client. */
export interface AuthResponse {
  readonly access_token: string;
  readonly user: {
    readonly id: string;
    readonly wallet_address: string;
    readonly role: string;
  };
}

/**
 * Service responsible for wallet-based authentication.
 * Verifies ed25519 signatures using tweetnacl and issues JWT tokens.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifies a wallet signature and returns a JWT access token.
   *
   * 1. Decodes the signature and public key from Base58
   * 2. Verifies the ed25519 signature using tweetnacl
   * 3. Looks up the user in the database by wallet address
   * 4. Issues a JWT containing user ID, wallet address, and role
   *
   * @param dto - The verified signature payload
   * @returns JWT access token and user profile
   * @throws UnauthorizedException if signature is invalid or user not found
   */
  async verifySignature(dto: VerifySignatureDto): Promise<AuthResponse> {
    const isValid = this.verifyEd25519Signature(
      dto.message,
      dto.signature,
      dto.wallet_address,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    const user = await this.prisma.user.findUnique({
      where: { wallet_address: dto.wallet_address },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Wallet address is not registered in the system',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      wallet_address: user.wallet_address,
      role: user.role.name,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        role: user.role.name,
      },
    };
  }

  /**
   * Verifies an ed25519 signature using tweetnacl.
   *
   * @param message - The plaintext message that was signed
   * @param signature - The Base58-encoded signature
   * @param walletAddress - The Solana wallet address (public key)
   * @returns true if the signature is valid, false otherwise
   */
  private verifyEd25519Signature(
    message: string,
    signature: string,
    walletAddress: string,
  ): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const publicKey = new PublicKey(walletAddress);
      const publicKeyBytes = publicKey.toBytes();

      // Decode Base58 signature using PublicKey utility for consistent decoding
      const signatureBytes = Buffer.from(signature, 'base64');

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes,
      );
    } catch {
      return false;
    }
  }
}
