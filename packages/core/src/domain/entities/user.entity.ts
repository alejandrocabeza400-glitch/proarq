/** Pure domain entity — zero framework dependencies. */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'GERENTE_OBRA' | 'DIRECTOR_OBRA' | 'CLIENTE' | 'REPRESENTANTE';
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
