import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from '../../src/app';
import request from 'supertest';
import prisma from '../../src/utils/prisma_connected';

describe('Authentication Tests - Register', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    role: 'CUSTOMER' as const,
  };

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'john.doe@example.com',
            'JOHN.DOE@EXAMPLE.COM',
            'admin@example.com',
            'jane.doe@example.com',
          ],
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'john.doe@example.com',
            'JOHN.DOE@EXAMPLE.COM',
            'admin@example.com',
            'jane.doe@example.com',
          ],
        },
      },
    });
  });

  describe('POST /v1/auth/register', () => {
    it('should register user successfully with valid data', async () => {
      const response = await request(app).post('/v1/auth/register').send(validUserData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully.');
      expect(response.body.data).toEqual({
        id: expect.any(Number),
        name: validUserData.name,
        email: validUserData.email,
        role: validUserData.role,
        created_at: expect.any(String),
      });

      // Ensure password is not returned
      expect(response.body.data.password).toBeUndefined();
    });

    it('should register user with default CUSTOMER role when role not provided', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'SecurePassword123!',
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('CUSTOMER');
    });

    it('should register user with ADMIN role when specified', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        role: 'ADMIN' as const,
      };

      const response = await request(app).post('/v1/auth/register').send(adminData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('ADMIN');
    });

    it('should fail when name is missing', async () => {
      const userData = {
        email: validUserData.email,
        password: validUserData.password,
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for name.');
      expect(response.body.data).toEqual([{ field: 'name', message: 'Name is required.' }]);
    });

    it('should fail when email is missing', async () => {
      const userData = {
        name: validUserData.name,
        password: validUserData.password,
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for email.');
      expect(response.body.data).toEqual([{ field: 'email', message: 'Email is required.' }]);
    });

    it('should fail when password is missing', async () => {
      const userData = {
        name: validUserData.name,
        email: validUserData.email,
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for password.');
      expect(response.body.data).toEqual([{ field: 'password', message: 'Password is required.' }]);
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        ...validUserData,
        email: 'invalid-email',
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for email.');
      expect(response.body.data).toEqual([
        { field: 'email', message: 'Please provide a valid email address.' },
      ]);
    });

    it('should fail with weak password (less than 8 characters)', async () => {
      const userData = {
        ...validUserData,
        password: '1234567', // 7 characters
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for password.');
      expect(response.body.data).toEqual([
        {
          field: 'password',
          message: 'Password is too weak. It must be at least 8 characters long.',
        },
      ]);
    });

    it('should fail when user already exists', async () => {
      // First registration
      await request(app).post('/v1/auth/register').send(validUserData);

      // Attempt duplicate registration
      const response = await request(app).post('/v1/auth/register').send(validUserData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('An account with this email already exists.');
      expect(response.body.data).toBe(null);
    });

    it('should handle case-insensitive email duplicates', async () => {
      // Register with lowercase email
      await request(app).post('/v1/auth/register').send(validUserData);

      // Attempt to register with uppercase email
      const upperCaseData = {
        ...validUserData,
        email: 'JOHN.DOE@EXAMPLE.COM',
      };

      const response = await request(app).post('/v1/auth/register').send(upperCaseData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('An account with this email already exists.');
    });

    it('should fail with empty name (whitespace only)', async () => {
      const userData = {
        ...validUserData,
        name: '   ', // Only whitespace
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for name.');
      expect(response.body.data).toEqual([{ field: 'name', message: 'Name is required.' }]);
    });

    it('should trim and lowercase email before saving', async () => {
      const userData = {
        ...validUserData,
        email: '  JOHN.DOE@EXAMPLE.COM  ', // With spaces and uppercase
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('john.doe@example.com');
    });

    it('should fail with multiple validation errors', async () => {
      const userData = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        password: '123', // Weak password
      };

      const response = await request(app).post('/v1/auth/register').send(userData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid input for name.');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data).toContainEqual({ field: 'name', message: 'Name is required.' });
      expect(response.body.data).toContainEqual({
        field: 'email',
        message: 'Please provide a valid email address.',
      });
      expect(response.body.data).toContainEqual({
        field: 'password',
        message: 'Password is too weak. It must be at least 8 characters long.',
      });
    });
  });
});
