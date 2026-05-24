import crypto from 'node:crypto';
import { AppError } from '../../errors/app.error';
import type { ResetPasswordInput } from '../ports/in/auth.input';
import type { UserRepository } from '../ports/out/user-repository.port';

export interface ResetPasswordResult {
  message: string;
}

export class AuthResetPasswordUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    // Hash the incoming token to match the SHA-256 hash stored in DB by forgot-password
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const user = await this.userRepo.findByResetToken(tokenHash);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token has expired
    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt.getTime() < Date.now()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Hash the new password
    const newPasswordHash = await Bun.password.hash(input.newPassword);

    // Update password and clear reset token
    await this.userRepo.updatePassword(user.id, newPasswordHash);
    await this.userRepo.clearResetToken(user.id);

    return { message: 'Password has been reset successfully.' };
  }
}
