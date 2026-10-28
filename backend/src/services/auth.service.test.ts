import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { register, login, getMe } from './auth.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/app-error';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  const testEmail = `test.student.${Date.now()}@futa.edu.ng`;
  const testPassword = 'StrongPassword123!';
  let createdUserId: string;

  after(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });
  });

  describe('register', () => {
    it('should reject email from non-school domain', async () => {
      await assert.rejects(
        async () => {
          await register({
            name: 'Non School User',
            email: 'user@gmail.com',
            password: testPassword,
            role: Role.USER,
          });
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'INVALID_EMAIL_DOMAIN');
          assert.equal(error.httpStatus, 400);
          return true;
        },
      );
    });

    it('should register a new user with valid @futa.edu.ng email', async () => {
      const result = await register({
        name: 'FUTA Student',
        email: testEmail,
        password: testPassword,
        role: Role.USER,
      });

      assert.ok(result.token);
      assert.ok(result.user.id);
      assert.equal(result.user.email, testEmail);
      assert.equal(result.user.name, 'FUTA Student');
      assert.equal(result.user.role, Role.USER);

      createdUserId = result.user.id;

      // Verify password was hashed in database
      const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
      assert.ok(dbUser);
      assert.notEqual(dbUser.passwordHash, testPassword);
      assert.ok(dbUser.passwordHash.startsWith('$2'));
    });

    it('should reject registration if email is already taken', async () => {
      await assert.rejects(
        async () => {
          await register({
            name: 'Duplicate Student',
            email: testEmail,
            password: testPassword,
            role: Role.USER,
          });
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'EMAIL_ALREADY_EXISTS');
          assert.equal(error.httpStatus, 409);
          return true;
        },
      );
    });
  });

  describe('login', () => {
    it('should reject incorrect password', async () => {
      await assert.rejects(
        async () => {
          await login({
            email: testEmail,
            password: 'WrongPassword!',
          });
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'INVALID_CREDENTIALS');
          assert.equal(error.httpStatus, 401);
          return true;
        },
      );
    });

    it('should reject non-existent user email', async () => {
      await assert.rejects(
        async () => {
          await login({
            email: 'nonexistent@futa.edu.ng',
            password: testPassword,
          });
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'INVALID_CREDENTIALS');
          assert.equal(error.httpStatus, 401);
          return true;
        },
      );
    });

    it('should login successfully with correct credentials', async () => {
      const result = await login({
        email: testEmail,
        password: testPassword,
      });

      assert.ok(result.token);
      assert.equal(result.user.id, createdUserId);
      assert.equal(result.user.email, testEmail);
    });
  });

  describe('getMe', () => {
    it('should return user details by id', async () => {
      const me = await getMe(createdUserId);
      assert.equal(me.id, createdUserId);
      assert.equal(me.email, testEmail);
      assert.equal(me.name, 'FUTA Student');
      assert.equal(me.role, Role.USER);
    });

    it('should throw 404 for unknown user id', async () => {
      await assert.rejects(
        async () => {
          await getMe('non-existent-user-id');
        },
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, 'USER_NOT_FOUND');
          assert.equal(error.httpStatus, 404);
          return true;
        },
      );
    });
  });
});
