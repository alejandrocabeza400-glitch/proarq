import { describe, expect, mock, test } from 'bun:test';
import type { UserRepository } from '@proarq/core/application/ports/out/user-repository.port';
import { AuthLoginUseCase } from '@proarq/core/application/use-cases/auth-login.use-case';
import { AppError } from '@proarq/core/errors';

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

describe('AuthLoginUseCase', () => {
  describe('when credentials are valid', () => {
    test('should return user with tokens on successful login', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async (email: string) => {
          if (email === 'admin@proarq.com') return mockUser;
          return null;
        }),
        create: mock(async () => mockUser),
      };

      // Mock Bun.password.verify
      const originalVerify = Bun.password.verify;
      Bun.password.verify = mock(async () => true) as typeof Bun.password.verify;

      const useCase = new AuthLoginUseCase(
        mockRepo,
        'test-secret-that-must-be-at-least-32-characters!!',
      );
      const result = await useCase.execute({
        email: 'admin@proarq.com',
        password: 'correct-password',
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('admin@proarq.com');
      expect(result.user.role).toBe('ADMIN');
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');

      Bun.password.verify = originalVerify;
    });
  });

  describe('when email does not exist', () => {
    test('should throw AppError with status 401', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async () => null),
        create: mock(async () => mockUser),
      };

      const useCase = new AuthLoginUseCase(
        mockRepo,
        'test-secret-that-must-be-at-least-32-characters!!',
      );

      try {
        await useCase.execute({
          email: 'nonexistent@test.com',
          password: 'any-password',
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(401);
      }
    });
  });

  describe('when password is wrong', () => {
    test('should throw AppError with status 401', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async (email: string) => {
          if (email === 'admin@proarq.com') return mockUser;
          return null;
        }),
        create: mock(async () => mockUser),
      };

      const originalVerify = Bun.password.verify;
      Bun.password.verify = mock(async () => false) as typeof Bun.password.verify;

      const useCase = new AuthLoginUseCase(
        mockRepo,
        'test-secret-that-must-be-at-least-32-characters!!',
      );

      try {
        await useCase.execute({
          email: 'admin@proarq.com',
          password: 'wrong-password',
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(401);
      }

      Bun.password.verify = originalVerify;
    });
  });

  describe('Bun.password.verify integration', () => {
    test('should call Bun.password.verify with correct arguments', async () => {
      const mockRepo: UserRepository = {
        findByEmail: mock(async (email: string) => {
          if (email === 'admin@proarq.com') return mockUser;
          return null;
        }),
        create: mock(async () => mockUser),
      };

      const verifyMock = mock(async (password: string, hash: string) => {
        expect(password).toBe('test-password');
        expect(hash).toBe('hashed_password_placeholder');
        return true;
      });

      const originalVerify = Bun.password.verify;
      Bun.password.verify = verifyMock as typeof Bun.password.verify;

      const useCase = new AuthLoginUseCase(
        mockRepo,
        'test-secret-that-must-be-at-least-32-characters!!',
      );
      await useCase.execute({
        email: 'admin@proarq.com',
        password: 'test-password',
      });

      expect(verifyMock).toHaveBeenCalledTimes(1);
      Bun.password.verify = originalVerify;
    });
  });
});
