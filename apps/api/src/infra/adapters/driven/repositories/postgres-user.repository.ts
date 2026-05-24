import { db } from '../database/connection';
import { users } from '../database/schema/user.schema';
import { eq, like, and, sql } from 'drizzle-orm';
import type { UserRepository, UserFilters } from '@proarq/core/application/ports/out/user-repository.port';
import type { User } from '@proarq/core/domain/entities/user.entity';
import { NotFoundError } from '@proarq/core';

/** Postgres adapter that implements the UserRepository port. */
export const postgresUserRepo: UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  },

  async findAll(filters?: UserFilters): Promise<User[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.name) {
      conditions.push(like(users.name, `%${filters.name}%`));
    }
    if (filters?.email) {
      conditions.push(like(users.email, `%${filters.email}%`));
    }
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    const query = db.select().from(users);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset);
  },

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      })
      .returning();
    return user;
  },

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'role'>>,
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  },

  async delete(id: string): Promise<void> {
    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing[0]) {
      throw new NotFoundError('User');
    }
    await db.delete(users).where(eq(users.id, id));
  },

  async findByResetToken(tokenHash: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.resetTokenHash, tokenHash))
      .limit(1);
    return result[0] ?? null;
  },

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: sql`NOW()` })
      .where(eq(users.id, userId));
  },

  async updateResetToken(userId: string, tokenHash: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiry,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId));
  },

  async clearResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId));
  },
};
