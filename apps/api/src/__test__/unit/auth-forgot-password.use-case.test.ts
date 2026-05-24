import { describe, expect, test, mock } from 'bun:test';
import { AuthForgotPasswordUseCase } from '@proarq/core/application/use-cases/auth-forgot-password.use-case';
import type { UserRepository } from '@proarq/core/application/ports/out/user-repository.port';
import { AppError } from '@proarq/core/errors';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test User',
  email: 'user@proarq.com',
  passwordHash: 'hashed_pw',
  role: 'DIRECTOR_OBRA' as const,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  resetTokenHash: null as string | null,
  resetTokenExpiresAt: null as Date | null,
};

describe('AuthForgotPasswordUseCase', () => {
  describe('when user exists', () => {
    test('should generate a reset token and return 200', async () => {
      let savedTokenHash: string | null = null;
      let savedExpiry: Date | null = null;

      const mockRepo: UserRepository = {
        findByEmail: mock(async (email: string) => {
          if (email === 'user@proarq.com') return { ...mockUser };
          return null;
        }),
        create: mock(async () => mockUser),
        updateResetToken: mock(async (userId: string, tokenHash: string, expiry: Date) => {
          savedTokenHash = tokenHash;
          savedExpiry = expiry;
        }),
      };

      const useCase = new AuthForgotPasswordUseCase(mockRepo);
      const result = await useCase.execute({ email: 'user@proarq.com' });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();

      // Token should have been saved
      expect(savedTokenHash).not.toBeNull();
      expect(savedExpiry).not.toBeNull();
      // Expiry should be in the future
      expect(savedExpiry!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('when user does not exist (security)', () => {
    test('should still return 200 to prevent email enumeration', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async () => null),
        create: mock(async () => mockUser),
        updateResetToken: mock(async () => {}),
      };

      const useCase = new AuthForgotPasswordUseCase(mockRepo);
      const result = await useCase.execute({ email: 'nonexistent@test.com' });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      // Should not throw - always return 200 for security
    });
  });

  describe('edge cases', () => {
    test('should generate a cryptographically random token', async () => {
      let savedTokenHash1: string | null = null;
      let savedTokenHash2: string | null = null;

      const mockRepo: UserRepository = {
        findByEmail: mock(async (email: string) => {
          if (email === 'user1@test.com') return { ...mockUser, email: 'user1@test.com' };
          if (email === 'user2@test.com') return { ...mockUser, email: 'user2@test.com' };
          return null;
        }),
        create: mock(async () => mockUser),
        updateResetToken: mock(async (userId: string, tokenHash: string) => {
          if (!savedTokenHash1) savedTokenHash1 = tokenHash;
          else savedTokenHash2 = tokenHash;
        }),
      };

      const useCase = new AuthForgotPasswordUseCase(mockRepo);

      await useCase.execute({ email: 'user1@test.com' });
      await useCase.execute({ email: 'user2@test.com' });

      // Two different users should get different tokens
      expect(savedTokenHash1).not.toBe(savedTokenHash2);
    });
  });
});
