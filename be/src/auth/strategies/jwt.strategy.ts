import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestUser } from '../../common/interfaces/request-user.interface';

/** Shape of the decoded JWT payload from the token. */
interface JwtPayload {
  readonly sub: string;
  readonly wallet_address: string;
  readonly role: string;
}

/**
 * Passport strategy for validating JWT Bearer tokens.
 * Extracts the token from the Authorization header, verifies it
 * against the JWT_SECRET, and maps the payload to a RequestUser.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'default-secret',
    });
  }

  /**
   * Called by Passport after the JWT is verified.
   * Maps the JWT payload to the RequestUser interface
   * which gets attached to req.user.
   *
   * @param payload - The decoded JWT payload
   * @returns The user object to attach to the request
   */
  validate(payload: JwtPayload): RequestUser {
    return {
      id: payload.sub,
      walletAddress: payload.wallet_address,
      role: payload.role,
    };
  }
}
