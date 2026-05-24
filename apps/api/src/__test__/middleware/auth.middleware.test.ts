import { describe, expect, mock, test } from 'bun:test';
import type { NextFunction, Request, Response } from 'express';
import { checkRole, decodeJWT } from '../../infra/adapters/driving/middleware/auth.middleware';

function createMockReq(headers: Record<string, string> = {}): Partial<Request> {
  return {
    headers,
    get: (name: string) => headers[name] || undefined,
  } as Partial<Request>;
}

function createMockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = mock((_code: number) => res) as any;
  res.json = mock((_body: any) => res) as any;
  return res;
}

describe('decodeJWT middleware', () => {
  test('should set req.user with valid JWT', async () => {
    const req = createMockReq({ authorization: 'Bearer valid.jwt.token' });
    const res = createMockRes();
    const next = mock(() => {});

    await decodeJWT(req as Request, res as Response, next as NextFunction);

    // req.user should be set with decoded payload
    expect((req as any).user).toBeDefined();
    expect((req as any).user.sub).toBeDefined();
    expect((req as any).user.role).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 when no token is provided', async () => {
    const req = createMockReq({});
    const res = createMockRes();
    const next = mock(() => {});

    await decodeJWT(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when token is malformed', async () => {
    const req = createMockReq({ authorization: 'Bearer invalid-token' });
    const res = createMockRes();
    const next = mock(() => {});

    await decodeJWT(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when Authorization header is missing Bearer prefix', async () => {
    const req = createMockReq({ authorization: 'Basic somehash' });
    const res = createMockRes();
    const next = mock(() => {});

    await decodeJWT(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('checkRole middleware', () => {
  test('should allow requests when role is in allowed list', () => {
    const req = { user: { sub: 'uuid', role: 'ADMIN' } } as Partial<Request>;
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = checkRole('ADMIN');
    middleware(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 403 when role is not in allowed list', () => {
    const req = { user: { sub: 'uuid', role: 'CLIENTE' } } as Partial<Request>;
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = checkRole('ADMIN');
    middleware(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 403 when req.user is not set', () => {
    const req = {} as Partial<Request>;
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = checkRole('ADMIN');
    middleware(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('should allow multiple roles', () => {
    const req = { user: { sub: 'uuid', role: 'GERENTE_OBRA' } } as Partial<Request>;
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = checkRole('ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA');
    middleware(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
  });

  test('should block role not in multi-role check', () => {
    const req = { user: { sub: 'uuid', role: 'CLIENTE' } } as Partial<Request>;
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = checkRole('ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA');
    middleware(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
