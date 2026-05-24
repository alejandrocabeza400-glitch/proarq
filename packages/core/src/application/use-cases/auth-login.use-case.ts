import jwt from 'jsonwebtoken';
import type { User } from '../../domain/entities/user.entity';
import { AppError } from '../../errors/app.error';
import type { LoginInput } from '../ports/in/auth.input';
import type { UserRepository } from '../ports/out/user-repository.port';

export interface AuthLoginResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export class AuthLoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string = '7d',
    private readonly jwtRefreshSecret: string = jwtSecret,
    private readonly jwtRefreshExpiresIn: string = '30d',
  ) {}

  async execute(input: LoginInput): Promise<AuthLoginResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await Bun.password.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ sub: user.id }, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    } as jwt.SignOptions);

    return { accessToken, refreshToken, user };
  }
}
