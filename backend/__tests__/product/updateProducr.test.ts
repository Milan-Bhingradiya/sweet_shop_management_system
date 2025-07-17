import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Product Management - Update Product', () => {
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
  let testProductId: number;

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
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

    // Create test category
    const testCategory = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    testCategoryId = testCategory.id;

    // Create test product
    const testProduct = await prisma.product.create({
      data: {
        name: 'Original Product',
        price: 1999,
        description: 'Original description',
        stock_quantity: 50,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/original.jpg'],
      },
    });
    testProductId = testProduct.id;
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
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

  describe('PUT /v1/admin/products/:id', () => {
    it('should update product successfully with all fields', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 2999,
        description: 'Updated description',
        stock_quantity: 75,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/updated1.jpg', 'https://example.com/updated2.jpg'],
      };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product updated successfully.');
      expect(response.body.data).toEqual({
        id: testProductId,
        name: 'Updated Product',
        price: 2999,
        description: 'Updated description',
        stock_quantity: 75,
        categoryId: testCategoryId,
        category: {
          id: testCategoryId,
          name: 'Test Category',
        },
        image_urls: ['https://example.com/updated1.jpg', 'https://example.com/updated2.jpg'],
        created_at: expect.any(String),
      });
    });

    it('should update product partially (only name and price)', async () => {
      const updateData = {
        name: 'Partially Updated Product',
        price: 3999,
      };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Partially Updated Product');
      expect(response.body.data.price).toBe(3999);
      expect(response.body.data.description).toBe('Original description'); // Should remain unchanged
      expect(response.body.data.stock_quantity).toBe(50); // Should remain unchanged
    });

    it('should fail without authentication token', async () => {
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .send(updateData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with customer token (non-admin)', async () => {
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid product ID', async () => {
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put('/v1/admin/products/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid product ID is required');
    });

    it('should fail with non-existent product ID', async () => {
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put('/v1/admin/products/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found.');
    });

    it('should fail with invalid price (negative)', async () => {
      const updateData = { price: -100 };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Price must be a positive number');
    });

    it('should fail with duplicate product name', async () => {
      // Create another product
      await prisma.product.create({
        data: {
          name: 'Another Product',
          price: 1999,
          stock_quantity: 10,
          categoryId: testCategoryId,
        },
      });

      // Try to update first product with second product's name
      const updateData = { name: 'Another Product' };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with this name already exists.');
    });

    it('should fail with invalid image URLs', async () => {
      const updateData = {
        image_urls: ['https://valid-url.com/image.jpg', 'invalid-url', 'not-a-url'],
      };

      const response = await request(app)
        .put(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('All image URLs must be valid URLs');
    });
  });
});
