import type { UserRepository } from '../ports/out/user-repository.port';
import type { CreateUserInput, UpdateUserInput, UserQueryInput } from '../ports/in/create-user.input';
import type { User } from '../../domain/entities/user.entity';
import { AppError } from '../../errors/app.error';
import { NotFoundError } from '../../errors/not-found.error';

/**
 * Create User Use Case.
 * Pure application logic — depends ONLY on the UserRepository interface.
 * No Express, no Drizzle, no HTTP.
 */
export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const validRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'];
    const role = input.role ?? 'CLIENTE';
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const passwordHash = await Bun.password.hash(input.password);

    return this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role,
    });
  }

  async findAll(filters?: UserQueryInput): Promise<User[]> {
    return this.userRepo.findAll(filters);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('User');
    }
    return this.userRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('User');
    }
    await this.userRepo.delete(id);
  }
}
