import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Category Management - Add Category', () => {
  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'ADMIN' as const,
  };

  const customerUser = {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'CustomerPassword123!',
    role: 'CUSTOMER' as const,
  };

  let adminToken: string;
  let customerToken: string;
  let adminId: number;

  // Setup: Create test users and get tokens
  beforeEach(async () => {
    // Clean up existing test data
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Traditional Sweets', 'Modern Desserts', 'Festival Specials', 'Duplicate Category'],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser.email, customerUser.email],
        },
      },
    });

    // Create test users
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);
    const hashedCustomerPassword = await bcrypt.hash(customerUser.password, 10);

    const admin = await prisma.user.create({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        password: hashedAdminPassword,
        role: adminUser.role,
      },
    });

    await prisma.user.create({
      data: {
        name: customerUser.name,
        email: customerUser.email,
        password: hashedCustomerPassword,
        role: customerUser.role,
      },
    });

    adminId = admin.id;

    // Get tokens by logging in
    const adminLoginResponse = await request(app).post('/v1/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });

    const customerLoginResponse = await request(app).post('/v1/auth/login').send({
      email: customerUser.email,
      password: customerUser.password,
    });

    adminToken = adminLoginResponse.body.data.token;
    customerToken = customerLoginResponse.body.data.token;
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Traditional Sweets', 'Modern Desserts', 'Festival Specials', 'Duplicate Category'],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser.email, customerUser.email],
        },
      },
    });
  });

  describe('POST /v1/admin/categories', () => {
    it('should create category successfully with valid admin token', async () => {
      const categoryData = {
        name: 'Traditional Sweets',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category created successfully.');
      expect(response.body.data).toEqual({
        id: expect.any(Number),
        name: categoryData.name,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      // Verify in database
      const createdCategory = await prisma.category.findUnique({
        where: { name: categoryData.name },
      });
      expect(createdCategory).toBeTruthy();
      expect(createdCategory?.name).toBe(categoryData.name);
    });

    it('should fail without authentication token', async () => {
      const categoryData = {
        name: 'Traditional Sweets',
      };

      const response = await request(app).post('/v1/admin/categories').send(categoryData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authorization header is required.');
    });

    it('should fail with customer token (insufficient permissions)', async () => {
      const categoryData = {
        name: 'Traditional Sweets',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required.');
    });

    it('should fail with invalid token', async () => {
      const categoryData = {
        name: 'Traditional Sweets',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', 'Bearer invalid-token')
        .send(categoryData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    it('should fail with missing category name', async () => {
      const categoryData = {};

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with empty category name', async () => {
      const categoryData = {
        name: '',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with whitespace-only category name', async () => {
      const categoryData = {
        name: '   ',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with duplicate category name', async () => {
      const categoryData = {
        name: 'Traditional Sweets',
      };

      // First creation - should succeed
      await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      // Second creation with same name - should fail
      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category with this name already exists.');
      expect(response.body.data).toBe(null);
    });

    it('should handle case-insensitive duplicate category names', async () => {
      const categoryData1 = {
        name: 'Traditional Sweets',
      };

      const categoryData2 = {
        name: 'TRADITIONAL SWEETS',
      };

      // First creation
      await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData1);

      // Second creation with different case - should fail
      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData2);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category with this name already exists.');
    });

    it('should trim whitespace from category name', async () => {
      const categoryData = {
        name: '  Traditional Sweets  ',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe('Traditional Sweets');

      // Verify in database
      const createdCategory = await prisma.category.findUnique({
        where: { name: 'Traditional Sweets' },
      });
      expect(createdCategory).toBeTruthy();
    });

    it('should fail with very long category name', async () => {
      const categoryData = {
        name: 'A'.repeat(256), // Very long name
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name must be less than 255 characters.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with invalid data type for name', async () => {
      const categoryData = {
        name: 123, // Number instead of string
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name must be a string.');
      expect(response.body.data).toBe(null);
    });

    it('should create multiple different categories successfully', async () => {
      const categories = [
        { name: 'Traditional Sweets' },
        { name: 'Modern Desserts' },
        { name: 'Festival Specials' },
      ];

      for (const categoryData of categories) {
        const response = await request(app)
          .post('/v1/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData);

        expect(response.statusCode).toBe(201);
        expect(response.body.data.name).toBe(categoryData.name);
      }

      // Verify all categories exist in database
      const allCategories = await prisma.category.findMany({
        where: {
          name: {
            in: categories.map((c) => c.name),
          },
        },
      });
      expect(allCategories).toHaveLength(3);
    });

    it('should return correct response schema', async () => {
      const categoryData = {
        name: 'Traditional Sweets',
      };

      const response = await request(app)
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        success: expect.any(Boolean),
        message: expect.any(String),
        data: {
          id: expect.any(Number),
          name: expect.any(String),
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      });

      // Verify data types
      expect(typeof response.body.data.id).toBe('number');
      expect(typeof response.body.data.name).toBe('string');
      expect(new Date(response.body.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(response.body.data.updated_at)).toBeInstanceOf(Date);
    });
  });
});
