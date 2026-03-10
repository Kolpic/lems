import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that protects routes by requiring a valid JWT Bearer token.
 * Delegates token extraction and validation to the Passport JwtStrategy.
 * On success, attaches the decoded user payload to req.user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
