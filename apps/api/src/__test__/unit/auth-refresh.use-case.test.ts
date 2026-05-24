import { describe, expect, mock, test } from 'bun:test';
import type { UserRepository } from '@proarq/core/application/ports/out/user-repository.port';
import { AuthRefreshTokenUseCase } from '@proarq/core/application/use-cases/auth-refresh.use-case';
import { AppError } from '@proarq/core/errors';
import jwt from 'jsonwebtoken';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Admin',
  email: 'admin@proarq.com',
  passwordHash: 'hashed_password_placeholder',
  role: 'ADMIN' as const,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  resetTokenHash: null,
  resetTokenExpiresAt: null,
};

const testSecret = 'test-secret-that-must-be-at-least-32-characters!!';

describe('AuthRefreshTokenUseCase', () => {
  describe('when refresh token is valid', () => {
    test('should return new tokens and user', async () => {
      const mockRepo: UserRepository = {
        findById: mock(async (id: string) => {
          if (id === mockUser.id) return mockUser;
          return null;
        }),
      } as unknown as UserRepository;

      const useCase = new AuthRefreshTokenUseCase(mockRepo, testSecret, '15m', testSecret, '7d');

      const validRefreshToken = jwt.sign({ sub: mockUser.id }, testSecret, { expiresIn: '7d' });

      const result = await useCase.execute({ refreshToken: validRefreshToken });

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
    });
  });

  describe('when refresh token is invalid or expired', () => {
    test('should throw AppError with status 401', async () => {
      const mockRepo: UserRepository = {
        findById: mock(async () => mockUser),
      } as unknown as UserRepository;

      const useCase = new AuthRefreshTokenUseCase(mockRepo, testSecret, '15m', testSecret, '7d');

      try {
        await useCase.execute({ refreshToken: 'invalid-token-string' });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(401);
        expect((err as AppError).message).toContain('Invalid or expired refresh token');
      }
    });
  });

  describe('when user does not exist in repository', () => {
    test('should throw AppError with status 401', async () => {
      const mockRepo: UserRepository = {
        findById: mock(async () => null),
      } as unknown as UserRepository;

      const useCase = new AuthRefreshTokenUseCase(mockRepo, testSecret, '15m', testSecret, '7d');

      const validRefreshToken = jwt.sign({ sub: 'non-existent-user-id' }, testSecret, {
        expiresIn: '7d',
      });

      try {
        await useCase.execute({ refreshToken: validRefreshToken });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(401);
        expect((err as AppError).message).toContain('User not found');
      }
    });
  });
});
