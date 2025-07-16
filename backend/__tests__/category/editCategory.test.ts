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
  let testCategoryId: number;
  let anotherCategoryId: number;

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
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

    await prisma.user.create({
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
      data: { name: 'Test Category' },
    });

    const anotherCategory = await prisma.category.create({
      data: { name: 'Another Category' },
    });

    testCategoryId = testCategory.id;
    anotherCategoryId = anotherCategory.id;
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser.email, customerUser.email],
        },
      },
    });
  });

  describe('PUT /v1/admin/categories/:id', () => {
    it('should update category successfully with valid admin token', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully.');
      expect(response.body.data.name).toBe('Updated Category');
    });

    it('should fail without authentication token', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .send(updateData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with customer token', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing name field', async () => {
      const updateData = {};

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Category name is required.');
    });

    it('should fail with empty string name', async () => {
      const updateData = { name: '' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Category name is required.');
    });

    it('should fail with duplicate category name', async () => {
      const updateData = { name: 'Another Category' };

      const response = await request(app)
        .put(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe('Category with this name already exists.');
    });

    it('should fail with non-existent category ID', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put('/v1/admin/categories/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Category not found.');
    });

    it('should fail with invalid category ID format', async () => {
      const updateData = { name: 'Updated Category' };

      const response = await request(app)
        .put('/v1/admin/categories/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid category ID format.');
    });
  });
});
