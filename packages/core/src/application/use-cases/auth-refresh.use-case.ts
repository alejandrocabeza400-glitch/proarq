import jwt from 'jsonwebtoken';
import type { User } from '../../domain/entities/user.entity';
import { AppError } from '../../errors/app.error';
import type { RefreshInput } from '../ports/in/auth.input';
import type { UserRepository } from '../ports/out/user-repository.port';

export interface AuthRefreshResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export class AuthRefreshTokenUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string = '7d',
    private readonly jwtRefreshSecret: string = jwtSecret,
    private readonly jwtRefreshExpiresIn: string = '30d',
  ) {}

  async execute(input: RefreshInput): Promise<AuthRefreshResult> {
    try {
      const decoded = jwt.verify(input.refreshToken, this.jwtRefreshSecret) as { sub: string };
      if (!decoded?.sub) {
        throw new AppError('Invalid refresh token', 401);
      }

      const user = await this.userRepo.findById(decoded.sub);
      if (!user) {
        throw new AppError('User not found', 401);
      }

      const accessToken = jwt.sign({ sub: user.id, role: user.role }, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
      } as jwt.SignOptions);

      const refreshToken = jwt.sign({ sub: user.id }, this.jwtRefreshSecret, {
        expiresIn: this.jwtRefreshExpiresIn,
      } as jwt.SignOptions);

      return { accessToken, refreshToken, user };
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }
}
