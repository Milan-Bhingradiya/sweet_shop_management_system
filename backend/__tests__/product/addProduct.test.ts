import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Product Management - Add Product', () => {
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

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
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
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
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

  describe('POST /v1/admin/products', () => {
    it('should add product successfully with valid admin token and image URLs', async () => {
      const productData = {
        name: 'Chocolate Cake',
        price: 2999,
        description: 'Delicious chocolate cake',
        stock_quantity: 50,
        categoryId: testCategoryId,
        image_urls: [
          'https://example.com/images/chocolate-cake-1.jpg',
          'https://example.com/images/chocolate-cake-2.jpg',
        ],
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added successfully.');
      expect(response.body.data).toEqual({
        id: expect.any(Number),
        name: 'Chocolate Cake',
        price: 2999,
        description: 'Delicious chocolate cake',
        stock_quantity: 50,
        categoryId: testCategoryId,
        category: {
          id: testCategoryId,
          name: 'Test Category',
        },
        image_urls: [
          'https://example.com/images/chocolate-cake-1.jpg',
          'https://example.com/images/chocolate-cake-2.jpg',
        ],
        created_at: expect.any(String),
      });

      // Verify product was created in database
      const createdProduct = await prisma.product.findUnique({
        where: { id: response.body.data.id },
      });
      expect(createdProduct).toBeTruthy();
      expect(createdProduct?.name).toBe('Chocolate Cake');
      expect(createdProduct?.image_urls).toHaveLength(2);
    });

    it('should add product successfully without image URLs', async () => {
      const productData = {
        name: 'Simple Cake',
        price: 1999,
        description: 'Simple vanilla cake',
        stock_quantity: 25,
        categoryId: testCategoryId,
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Simple Cake');
      expect(response.body.data.image_urls).toEqual([]);
    });

    it('should fail without authentication token', async () => {
      const productData = {
        name: 'Test Product',
        price: 1999,
        stock_quantity: 10,
        categoryId: testCategoryId,
      };

      const response = await request(app).post('/v1/admin/products').send(productData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with customer token (non-admin)', async () => {
      const productData = {
        name: 'Test Product',
        price: 1999,
        stock_quantity: 10,
        categoryId: testCategoryId,
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(productData);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          // Missing price, stock_quantity, categoryId
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should fail with invalid price (negative)', async () => {
      const productData = {
        name: 'Test Product',
        price: -100,
        stock_quantity: 10,
        categoryId: testCategoryId,
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Price must be a positive number');
    });

    it('should fail with invalid stock quantity (negative)', async () => {
      const productData = {
        name: 'Test Product',
        price: 1999,
        stock_quantity: -5,
        categoryId: testCategoryId,
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Stock quantity must be 0 or greater');
    });

    it('should fail with non-existent category ID', async () => {
      const productData = {
        name: 'Test Product',
        price: 1999,
        stock_quantity: 10,
        categoryId: 999999,
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found.');
    });

    it('should fail with duplicate product name', async () => {
      // Create first product
      await prisma.product.create({
        data: {
          name: 'Unique Product',
          price: 1999,
          stock_quantity: 10,
          categoryId: testCategoryId,
        },
      });

      // Try to create product with same name
      const productData = {
        name: 'Unique Product',
        price: 2999,
        stock_quantity: 20,
        categoryId: testCategoryId,
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with this name already exists.');
    });

    it('should fail with invalid image URLs', async () => {
      const productData = {
        name: 'Test Product',
        price: 1999,
        stock_quantity: 10,
        categoryId: testCategoryId,
        image_urls: [
          'https://valid-url.com/image1.jpg',
          'invalid-url', // Invalid URL
          'not-a-url-at-all', // Invalid URL
        ],
      };

      const response = await request(app)
        .post('/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('All image URLs must be valid URLs');
    });
  });
});
