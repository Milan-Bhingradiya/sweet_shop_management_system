import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from '../../src/app';
import request from 'supertest';
import prisma from '../../src/utils/prisma_connected';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication Tests - Login', () => {
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

  let authToken: string;

  // Setup: Create test users before each test
  beforeEach(async () => {
    // Clean up existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [validUser.email, adminUser.email, 'JOHN.DOE@EXAMPLE.COM'],
        },
      },
    });

    // Create test users with hashed passwords
    const hashedPassword = await bcrypt.hash(validUser.password, 10);
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);

    await prisma.user.create({
      data: {
        name: validUser.name,
        email: validUser.email,
        password: hashedPassword,
        role: validUser.role,
      },
    });

    await prisma.user.create({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        password: hashedAdminPassword,
        role: adminUser.role,
      },
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [validUser.email, adminUser.email, 'JOHN.DOE@EXAMPLE.COM'],
        },
      },
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: validUser.email,
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful.');
      expect(response.body.data).toEqual({
        user: {
          id: expect.any(Number),
          name: validUser.name,
          email: validUser.email,
          role: validUser.role,
          created_at: expect.any(String),
        },
        token: expect.any(String),
      });

      // Ensure password is not returned
      expect(response.body.data.user.password).toBeUndefined();

      // Token should be a valid JWT format (3 parts separated by dots)
      expect(response.body.data.token.split('.')).toHaveLength(3);

      // Store token for other tests
      authToken = response.body.data.token;
    });

    it('should return a valid JWT token with correct payload', async () => {
      const loginData = {
        email: validUser.email,
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(200);

      const token = response.body.data.token;

      // Verify JWT structure
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Decode token without verification (for testing payload structure)
      const decoded = jwt.decode(token) as any;

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration

      expect(decoded.id).toBe(response.body.data.user.id);
      expect(decoded.role).toBe(validUser.role);

      // Verify token expiration is in the future
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should return token with 24 hour expiration', async () => {
      const loginData = {
        email: validUser.email,
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      const token = response.body.data.token;
      const decoded = jwt.decode(token) as any;

      // Check if expiration is approximately 24 hours from now (within 1 minute tolerance)
      const expectedExp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      expect(decoded.exp).toBeGreaterThan(expectedExp - 60);
      expect(decoded.exp).toBeLessThan(expectedExp + 60);
    });

    it('should login successfully with admin credentials and return admin role in token', async () => {
      const loginData = {
        email: adminUser.email,
        password: adminUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('ADMIN');

      // Verify token contains admin role
      const token = response.body.data.token;
      const decoded = jwt.decode(token) as any;
      expect(decoded.role).toBe('ADMIN');
    });

    it('should handle case-insensitive email login', async () => {
      const loginData = {
        email: 'JOHN.DOE@EXAMPLE.COM', // Uppercase email
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
    });

    it('should trim whitespace from email', async () => {
      const loginData = {
        email: '  john.doe@example.com  ', // Email with spaces
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
    });

    it('should fail with missing email', async () => {
      const loginData = {
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with missing password', async () => {
      const loginData = {
        email: validUser.email,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide a valid email address.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with incorrect password', async () => {
      const loginData = {
        email: validUser.email,
        password: 'WrongPassword123!',
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with empty request body', async () => {
      const response = await request(app).post('/v1/auth/login').send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with empty string email', async () => {
      const loginData = {
        email: '',
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with empty string password', async () => {
      const loginData = {
        email: validUser.email,
        password: '',
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with whitespace-only email', async () => {
      const loginData = {
        email: '   ',
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required.');
      expect(response.body.data).toBe(null);
    });

    it('should return user with correct schema fields', async () => {
      const loginData = {
        email: validUser.email,
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

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

    it('should handle SQL injection attempts in email', async () => {
      const loginData = {
        email: "' OR '1'='1",
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide a valid email address.');
    });

    it('should handle very long password gracefully', async () => {
      const loginData = {
        email: validUser.email,
        password: 'a'.repeat(10000), // Very long password
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password.');
    });
  });

  describe('JWT Token Security Tests', () => {
    it('should generate unique tokens for each login session', async () => {
      const loginData = {
        email: validUser.email,
        password: validUser.password,
      };

      // First login
      const response1 = await request(app).post('/v1/auth/login').send(loginData);

      // Second login
      const response2 = await request(app).post('/v1/auth/login').send(loginData);

      expect(response1.body.data.token).not.toBe(response2.body.data.token);
    });

    it('should not include sensitive information in JWT payload', async () => {
      const loginData = {
        email: validUser.email,
        password: validUser.password,
      };

      const response = await request(app).post('/v1/auth/login').send(loginData);

      const token = response.body.data.token;
      const decoded = jwt.decode(token) as any;

      // Should not contain password or other sensitive data
      expect(decoded).not.toHaveProperty('password');
      expect(decoded).not.toHaveProperty('email'); // Email can be considered sensitive

      // Should only contain minimal necessary data
      expect(Object.keys(decoded)).toEqual(expect.arrayContaining(['id', 'role', 'iat', 'exp']));
    });
  });
});
