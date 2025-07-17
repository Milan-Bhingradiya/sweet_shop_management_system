import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';

describe('User Product Management - Get Product Details', () => {
  let testCategoryId: number;
  let testProductId: number;
  let outOfStockProductId: number;

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create test category
    const category = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    testCategoryId = category.id;

    // Create test products
    const inStockProduct = await prisma.product.create({
      data: {
        name: 'Available Product',
        price: 2999,
        description: 'This product is available',
        stock_quantity: 25,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/product1.jpg', 'https://example.com/product2.jpg'],
      },
    });
    testProductId = inStockProduct.id;

    const outOfStockProduct = await prisma.product.create({
      data: {
        name: 'Out of Stock Product',
        price: 1999,
        description: 'This product is out of stock',
        stock_quantity: 0,
        categoryId: testCategoryId,
        image_urls: [],
      },
    });
    outOfStockProductId = outOfStockProduct.id;
  });

  afterEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  describe('GET /v1/user/products/:id', () => {
    it('should get product details successfully (no auth required)', async () => {
      const response = await request(app).get(`/v1/user/products/${testProductId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product details retrieved successfully.');
      expect(response.body.data).toEqual({
        id: testProductId,
        name: 'Available Product',
        price: 2999,
        description: 'This product is available',
        stock_quantity: 25,
        categoryId: testCategoryId,
        category: {
          id: testCategoryId,
          name: 'Test Category',
        },
        image_urls: ['https://example.com/product1.jpg', 'https://example.com/product2.jpg'],
        created_at: expect.any(String),
        isInStock: true,
      });
    });

    it('should get out of stock product details', async () => {
      const response = await request(app).get(`/v1/user/products/${outOfStockProductId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Out of Stock Product');
      expect(response.body.data.stock_quantity).toBe(0);
      expect(response.body.data.isInStock).toBe(false);
      expect(response.body.data.image_urls).toEqual([]);
    });

    it('should fail with invalid product ID', async () => {
      const response = await request(app).get('/v1/user/products/invalid-id');

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid product ID is required');
    });

    it('should fail with non-existent product ID', async () => {
      const response = await request(app).get('/v1/user/products/999999');

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found.');
    });

    it('should include category information', async () => {
      const response = await request(app).get(`/v1/user/products/${testProductId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.category).toEqual({
        id: testCategoryId,
        name: 'Test Category',
      });
      expect(response.body.data.categoryId).toBe(testCategoryId);
    });

    it('should handle product with null description', async () => {
      // Create product with null description
      const productWithNullDesc = await prisma.product.create({
        data: {
          name: 'No Description Product',
          price: 999,
          description: null,
          stock_quantity: 10,
          categoryId: testCategoryId,
          image_urls: [],
        },
      });

      const response = await request(app).get(`/v1/user/products/${productWithNullDesc.id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.description).toBeNull();
      expect(response.body.data.name).toBe('No Description Product');
    });
  });
});
