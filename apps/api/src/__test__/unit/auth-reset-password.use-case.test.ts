import { describe, expect, mock, test } from 'bun:test';
import crypto from 'node:crypto';
import type { UserRepository } from '@proarq/core/application/ports/out/user-repository.port';
import { AuthResetPasswordUseCase } from '@proarq/core/application/use-cases/auth-reset-password.use-case';
import { AppError } from '@proarq/core/errors';

const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

// The reset-password flow hashes the incoming token with SHA-256 before lookup
const validToken = 'valid_token_hash_sha256';
const validTokenHash = crypto.createHash('sha256').update(validToken).digest('hex');

const expiredToken = 'expired_token_hash';
const _expiredTokenHash = crypto.createHash('sha256').update(expiredToken).digest('hex');

const invalidToken = 'invalid_token_hash';
const _invalidTokenHash = crypto.createHash('sha256').update(invalidToken).digest('hex');

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test User',
  email: 'user@proarq.com',
  passwordHash: 'old_hashed_pw',
  role: 'DIRECTOR_OBRA' as const,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  resetTokenHash: validTokenHash,
  resetTokenExpiresAt: futureDate,
};

describe('AuthResetPasswordUseCase', () => {
  describe('when token is valid and not expired', () => {
    test('should update password successfully', async () => {
      let updatedPasswordHash = '';
      let _clearedTokenHash: string | null = null;

      const mockRepo: UserRepository = {
        findByEmail: mock(async () => null),
        create: mock(async () => mockUser),
        findByResetToken: mock(async (tokenHash: string) => {
          if (tokenHash === validTokenHash) return mockUser;
          return null;
        }),
        updatePassword: mock(async (_userId: string, passwordHash: string) => {
          updatedPasswordHash = passwordHash;
        }),
        clearResetToken: mock(async (_userId: string) => {
          _clearedTokenHash = '';
        }),
      };

      const originalHash = Bun.password.hash;
      Bun.password.hash = mock(async (password: string) => {
        expect(password).toBe('NewSecurePass123!');
        return 'new_hashed_password';
      }) as typeof Bun.password.hash;

      const useCase = new AuthResetPasswordUseCase(mockRepo);
      const result = await useCase.execute({
        token: validToken,
        newPassword: 'NewSecurePass123!',
      });

      expect(result).toBeDefined();
      expect(updatedPasswordHash).toBe('new_hashed_password');

      Bun.password.hash = originalHash;
    });
  });

  describe('when token is expired', () => {
    test('should throw AppError with 400', async () => {
      const expiredUser = { ...mockUser, resetTokenExpiresAt: pastDate };

      const mockRepo: UserRepository = {
        findByEmail: mock(async () => null),
        create: mock(async () => mockUser),
        findByResetToken: mock(async () => expiredUser),
        updatePassword: mock(async () => {}),
        clearResetToken: mock(async () => {}),
      };

      const useCase = new AuthResetPasswordUseCase(mockRepo);

      try {
        await useCase.execute({
          token: expiredToken,
          newPassword: 'NewSecurePass123!',
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).message.toLowerCase()).toContain('expir');
      }
    });
  });

  describe('when token is invalid', () => {
    test('should throw AppError with 400', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async () => null),
        create: mock(async () => mockUser),
        findByResetToken: mock(async () => null),
        updatePassword: mock(async () => {}),
        clearResetToken: mock(async () => {}),
      };

      const useCase = new AuthResetPasswordUseCase(mockRepo);

      try {
        await useCase.execute({
          token: invalidToken,
          newPassword: 'NewSecurePass123!',
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
      }
    });
  });

  describe('Bun.password.hash integration', () => {
    test('should hash the new password before storing', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async () => null),
        create: mock(async () => mockUser),
        findByResetToken: mock(async () => mockUser),
        updatePassword: mock(async () => {}),
        clearResetToken: mock(async () => {}),
      };

      const hashMock = mock(async (password: string) => {
        expect(password).toBe('NewPassword123');
        return 'bcrypt_hash_of_new_password';
      });

      const originalHash = Bun.password.hash;
      Bun.password.hash = hashMock as typeof Bun.password.hash;

      const useCase = new AuthResetPasswordUseCase(mockRepo);
      await useCase.execute({
        token: validToken,
        newPassword: 'NewPassword123',
      });

      expect(hashMock).toHaveBeenCalledTimes(1);
      expect(hashMock).toHaveBeenCalledWith('NewPassword123');

      Bun.password.hash = originalHash;
    });
  });
});
