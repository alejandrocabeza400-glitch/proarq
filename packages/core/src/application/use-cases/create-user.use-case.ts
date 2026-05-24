import type { User } from '../../domain/entities/user.entity';
import { AppError } from '../../errors/app.error';
import { NotFoundError } from '../../errors/not-found.error';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
} from '../ports/in/create-user.input';
import type { AuditRepository } from '../ports/out/audit-repository.port';
import type { UserRepository } from '../ports/out/user-repository.port';

/**
 * Create User Use Case.
 * Pure application logic — depends ONLY on the UserRepository interface.
 * No Express, no Drizzle, no HTTP.
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly auditRepo?: AuditRepository,
  ) {}

  async execute(input: CreateUserInput, actorUserId?: string): Promise<User> {
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

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role,
    });

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'users',
        recordId: user.id,
        action: 'INSERT',
        userId: actorUserId,
        dataHistory: {
          before: {},
          after: { name: user.name, email: user.email, role: user.role },
        },
      });
    }

    return user;
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

  async update(id: string, data: UpdateUserInput, actorUserId?: string): Promise<User> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('User');
    }

    const before = {
      name: existing.name,
      email: existing.email,
      role: existing.role,
    };

    const updated = await this.userRepo.update(id, data);

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'users',
        recordId: id,
        action: 'UPDATE',
        userId: actorUserId,
        dataHistory: {
          before,
          after: { name: updated.name, email: updated.email, role: updated.role },
        },
      });
    }

    return updated;
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('User');
    }

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'users',
        recordId: id,
        action: 'DELETE',
        userId: actorUserId,
        dataHistory: {
          before: { name: existing.name, email: existing.email, role: existing.role },
          after: {},
        },
      });
    }

    await this.userRepo.delete(id);
  }
}
