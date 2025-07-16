import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from '../../src/app';
import request from 'supertest';
import prisma from '../../src/utils/prisma_connected';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication Tests - Verify JWT', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    role: 'CUSTOMER' as const,
  };

  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'ADMIN' as const,
  };

  let customerToken: string;
  let adminToken: string;
  let userId: number;
  let adminId: number;

  // Setup: Create test users and get tokens
  beforeEach(async () => {
    // Clean up existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [validUser.email, adminUser.email],
        },
      },
    });

    // Create test users with hashed passwords
    const hashedPassword = await bcrypt.hash(validUser.password, 10);
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);

    const customer = await prisma.user.create({
      data: {
        name: validUser.name,
        email: validUser.email,
        password: hashedPassword,
        role: validUser.role,
      },
    });

    const admin = await prisma.user.create({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        password: hashedAdminPassword,
        role: adminUser.role,
      },
    });

    userId = customer.id;
    adminId = admin.id;

    // Get tokens by logging in
    const customerLoginResponse = await request(app).post('/v1/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    const adminLoginResponse = await request(app).post('/v1/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });

    customerToken = customerLoginResponse.body.data.token;
    adminToken = adminLoginResponse.body.data.token;
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [validUser.email, adminUser.email],
        },
      },
    });
  });

  describe('GET /v1/auth/verify', () => {
    it('should verify valid customer token and return user data', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token is valid.');
      expect(response.body.data).toEqual({
        valid: true,
        user: {
          id: userId,
          name: validUser.name,
          email: validUser.email,
          role: 'CUSTOMER',
          created_at: expect.any(String),
        },
      });

      // Ensure password is not returned
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should verify valid admin token and return admin data', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token is valid.');
      expect(response.body.data).toEqual({
        valid: true,
        user: {
          id: adminId,
          name: adminUser.name,
          email: adminUser.email,
          role: 'ADMIN',
          created_at: expect.any(String),
        },
      });
    });

    it('should fail with missing Authorization header', async () => {
      const response = await request(app).get('/v1/auth/verify');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authorization header is required.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should fail with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', 'InvalidFormat');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bearer token is required.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should fail with missing token after Bearer', async () => {
      const response = await request(app).get('/v1/auth/verify').set('Authorization', 'Bearer ');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token is required.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should fail with invalid token format', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', 'Bearer invalid-token-format');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should fail with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: userId, role: 'CUSTOMER' },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        { expiresIn: '-1h' }, // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token has expired.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should fail with token signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign({ id: userId, role: 'CUSTOMER' }, 'wrong-secret-key', {
        expiresIn: '24h',
      });

      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should fail when user no longer exists in database', async () => {
      // Delete the user from database but keep the token
      await prisma.user.delete({
        where: { id: userId },
      });

      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should return correct user schema structure', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.user).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        created_at: expect.any(String),
      });

      // Verify specific field types
      expect(typeof response.body.data.user.id).toBe('number');
      expect(typeof response.body.data.user.name).toBe('string');
      expect(typeof response.body.data.user.email).toBe('string');
      expect(['ADMIN', 'CUSTOMER']).toContain(response.body.data.user.role);
      expect(new Date(response.body.data.user.created_at)).toBeInstanceOf(Date);
    });

    it('should handle concurrent token verification requests', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app).get('/v1/auth/verify').set('Authorization', `Bearer ${customerToken}`),
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.user.id).toBe(userId);
      });
    });

    it('should fail with whitespace-only token', async () => {
      const response = await request(app).get('/v1/auth/verify').set('Authorization', 'Bearer    ');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token is required.');
      expect(response.body.data).toEqual({
        valid: false,
        user: null,
      });
    });

    it('should decode token payload correctly for customer', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);

      // Verify the token contains correct payload info
      const decoded = jwt.decode(customerToken) as any;
      expect(response.body.data.user.id).toBe(decoded.id);
      expect(response.body.data.user.role).toBe(decoded.role);
    });

    it('should decode token payload correctly for admin', async () => {
      const response = await request(app)
        .get('/v1/auth/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);

      // Verify the token contains correct payload info
      const decoded = jwt.decode(adminToken) as any;
      expect(response.body.data.user.id).toBe(decoded.id);
      expect(response.body.data.user.role).toBe(decoded.role);
      expect(response.body.data.user.role).toBe('ADMIN');
    });
  });
});
