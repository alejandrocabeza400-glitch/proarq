import crypto from 'node:crypto';
import type { ForgotPasswordInput } from '../ports/in/auth.input';
import type { UserRepository } from '../ports/out/user-repository.port';

export interface ForgotPasswordResult {
  message: string;
}

export class AuthForgotPasswordUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    const user = await this.userRepo.findByEmail(input.email);

    // Always return 200 to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // Generate cryptographically random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 1 hour
    const expiry = new Date(Date.now() + 3600000);

    await this.userRepo.updateResetToken(user.id, tokenHash, expiry);

    // In development, log the reset URL
    const _resetUrl = `${Bun.env.LOGO_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    if (Bun.env.NODE_ENV === 'development') {
    }

    return { message: 'If the email exists, a reset link has been sent.' };
  }
}
