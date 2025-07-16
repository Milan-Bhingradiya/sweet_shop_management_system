import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Category Management - Edit Category', () => {
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
  let testCategoryId: number;
  let anotherCategoryId: number;

  // Setup: Create test users, tokens, and categories
  beforeEach(async () => {
    // Clean up existing test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Test Category', 'Another Category', 'Updated Category', 'Existing Category'],
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

    // Create test categories
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
      },
    });

    const anotherCategory = await prisma.category.create({
      data: {
        name: 'Another Category',
      },
    });

    testCategoryId = testCategory.id;
    anotherCategoryId = anotherCategory.id;
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Test Category', 'Another Category', 'Updated Category', 'Existing Category'],
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

  describe('PUT /v1/admin/categories/:id', () => {
    it('should update category successfully with valid admin token and data', async () => {
      const updateData = {
        name: 'Updated Category',
      };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully.');
      expect(response.body.data).toEqual({
        id: testCategoryId,
        name: 'Updated Category',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      // Verify category is updated in database
      const updatedCategory = await prisma.category.findUnique({
        where: { id: testCategoryId },
      });
      expect(updatedCategory?.name).toBe('Updated Category');
    });

    it('should fail without authentication token', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .send(updateData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authorization header is required.');
    });

    it('should fail with customer token (insufficient permissions)', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required.');
    });

    it('should fail with invalid token', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', 'Bearer invalid-token')
        .send(updateData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    it('should fail with missing request body', async () => {
      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Request body is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with missing name field', async () => {
      const updateData = {};

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with null name', async () => {
      const updateData = { name: null };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with non-string name', async () => {
      const updateData = { name: 123 };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name must be a string.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with empty string name', async () => {
      const updateData = { name: '' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with whitespace-only name', async () => {
      const updateData = { name: '   ' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with name longer than 255 characters', async () => {
      const longName = 'a'.repeat(256);
      const updateData = { name: longName };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name must be less than 255 characters.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with duplicate category name', async () => {
      const updateData = { name: 'Another Category' }; // This name already exists

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category with this name already exists.');
      expect(response.body.data).toBe(null);
    });

    it('should allow updating category with same name (case insensitive check)', async () => {
      const updateData = { name: 'test category' }; // Same as existing but different case

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test category');
    });

    it('should fail with non-existent category ID', async () => {
      const nonExistentId = 999999;
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with invalid category ID format', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put('/v1/admin/categories/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with negative category ID', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put('/v1/admin/categories/-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with zero as category ID', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put('/v1/admin/categories/0')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should trim whitespace from category name', async () => {
      const updateData = { name: '  Trimmed Category  ' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Trimmed Category');

      // Verify in database
      const updatedCategory = await prisma.category.findUnique({
        where: { id: testCategoryId },
      });
      expect(updatedCategory?.name).toBe('Trimmed Category');
    });

    it('should return correct response schema for successful update', async () => {
      const updateData = { name: 'Schema Test Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
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
      expect(typeof response.body.data.created_at).toBe('string');
      expect(typeof response.body.data.updated_at).toBe('string');

      // Verify updated_at is different from created_at
      expect(response.body.data.updated_at).not.toBe(response.body.data.created_at);
    });

    it('should handle concurrent update requests gracefully', async () => {
      const updateData1 = { name: 'Concurrent Update 1' };
      const updateData2 = { name: 'Concurrent Update 2' };

      // Create additional category for second concurrent request
      const additionalCategory = await prisma.category.create({
        data: { name: 'Additional Category' },
      });

      const promises = [
        request(app)
          .put(`/v1/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData1),
        request(app)
          .put(`/v1/admin/categories/${additionalCategory.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData2),
      ];

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify both categories are updated
      const category1 = await prisma.category.findUnique({
        where: { id: testCategoryId },
      });
      const category2 = await prisma.category.findUnique({
        where: { id: additionalCategory.id },
      });

      expect(category1?.name).toBe('Concurrent Update 1');
      expect(category2?.name).toBe('Concurrent Update 2');
    });

    it('should maintain database integrity after update', async () => {
      const updateData = { name: 'Integrity Test Category' };

      // Get initial category count
      const initialCount = await prisma.category.count();

      // Update category
      await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Verify count remains the same
      const finalCount = await prisma.category.count();
      expect(finalCount).toBe(initialCount);

      // Verify specific category is updated
      const updatedCategory = await prisma.category.findUnique({
        where: { id: testCategoryId },
      });
      expect(updatedCategory?.name).toBe('Integrity Test Category');

      // Verify other categories are unchanged
      const otherCategory = await prisma.category.findUnique({
        where: { id: anotherCategoryId },
      });
      expect(otherCategory?.name).toBe('Another Category');
    });
  });
});
