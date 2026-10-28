import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from './require-auth';
import { requireRole } from './require-role';
import { generateToken } from '../services/auth.service';
import { AppError } from '../errors/app-error';
import { Role } from '@prisma/client';

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    it('should throw 401 when Authorization header is missing', () => {
      const req = { headers: {} } as Request;
      const res = {} as Response;
      const next = (() => {}) as NextFunction;

      assert.throws(
        () => requireAuth(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'UNAUTHORIZED');
          assert.equal(error.httpStatus, 401);
          return true;
        },
      );
    });

    it('should throw 401 when token is invalid', () => {
      const req = { headers: { authorization: 'Bearer invalid.token.here' } } as Request;
      const res = {} as Response;
      const next = (() => {}) as NextFunction;

      assert.throws(
        () => requireAuth(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'INVALID_TOKEN');
          assert.equal(error.httpStatus, 401);
          return true;
        },
      );
    });

    it('should populate req.user when valid token is provided', () => {
      const token = generateToken({ userId: 'user-123', role: Role.USER });
      const req = { headers: { authorization: `Bearer ${token}` } } as Request;
      const res = {} as Response;
      let nextCalled = false;
      const next = (() => {
        nextCalled = true;
      }) as NextFunction;

      requireAuth(req, res, next);
      assert.equal(nextCalled, true);
      assert.deepEqual(req.user, { id: 'user-123', role: Role.USER });
    });
  });

  describe('requireRole', () => {
    it('should allow user with required role', () => {
      const req = { user: { id: 'sec-1', role: Role.SECURITY } } as Request;
      const res = {} as Response;
      let nextCalled = false;
      const next = (() => {
        nextCalled = true;
      }) as NextFunction;

      const middleware = requireRole(Role.SECURITY, Role.ADMIN);
      middleware(req, res, next);
      assert.equal(nextCalled, true);
    });

    it('should reject user with insufficient role with 403', () => {
      const req = { user: { id: 'usr-1', role: Role.USER } } as Request;
      const res = {} as Response;
      const next = (() => {}) as NextFunction;

      const middleware = requireRole(Role.SECURITY, Role.ADMIN);
      assert.throws(
        () => middleware(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'FORBIDDEN');
          assert.equal(error.httpStatus, 403);
          return true;
        },
      );
    });
  });
});
