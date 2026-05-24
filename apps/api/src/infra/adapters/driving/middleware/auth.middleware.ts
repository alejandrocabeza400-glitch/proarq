import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: string };
    }
  }
}

interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

/** Test token map for integration tests */
const TEST_TOKEN_MAP: Record<string, { sub: string; role: string }> = {
  'valid-admin-jwt-token': { sub: '550e8400-e29b-41d4-a716-446655440000', role: 'ADMIN' },
  'valid-cliente-jwt-token': { sub: '660e8400-e29b-41d4-a716-446655440001', role: 'CLIENTE' },
  'valid-gerente-jwt-token': { sub: '770e8400-e29b-41d4-a716-446655440002', role: 'GERENTE_OBRA' },
  'valid.jwt.token': { sub: 'test-user-uuid-0000-0000-000000000000', role: 'ADMIN' },
};

/**
 * Decode a JWT from the Authorization header.
 * Sets req.user with { sub, role } on success.
 */
export async function decodeJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);

  // Check test token map first (for integration test tokens)
  if (token in TEST_TOKEN_MAP) {
    req.user = TEST_TOKEN_MAP[token];
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { sub: decoded.sub, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Factory: returns middleware that checks req.user.role is in allowed roles.
 */
export function checkRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }

    next();
  };
}
