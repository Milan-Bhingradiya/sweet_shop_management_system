import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';

describe('User Product Management - List Products', () => {
  let testCategoryId1: number;
  let testCategoryId2: number;

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create test categories
    const category1 = await prisma.category.create({
      data: { name: 'Cakes' },
    });
    const category2 = await prisma.category.create({
      data: { name: 'Cookies' },
    });
    testCategoryId1 = category1.id;
    testCategoryId2 = category2.id;

    // Create test products
    await prisma.product.createMany({
      data: [
        {
          name: 'Chocolate Cake',
          price: 2999,
          description: 'Rich chocolate cake',
          stock_quantity: 10,
          categoryId: testCategoryId1,
          image_urls: ['https://example.com/cake1.jpg'],
        },
        {
          name: 'Vanilla Cake',
          price: 2499,
          description: 'Sweet vanilla cake',
          stock_quantity: 0, // Out of stock
          categoryId: testCategoryId1,
          image_urls: ['https://example.com/cake2.jpg'],
        },
        {
          name: 'Chocolate Chip Cookie',
          price: 299,
          description: 'Crispy chocolate chip cookie',
          stock_quantity: 50,
          categoryId: testCategoryId2,
          image_urls: [],
        },
        {
          name: 'Strawberry Tart',
          price: 1899,
          description: 'Fresh strawberry tart',
          stock_quantity: 5,
          categoryId: testCategoryId1,
          image_urls: ['https://example.com/tart1.jpg'],
        },
        {
          name: 'Expensive Cake',
          price: 9999,
          description: 'Very expensive premium cake',
          stock_quantity: 2,
          categoryId: testCategoryId1,
          image_urls: ['https://example.com/expensive.jpg'],
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  describe('GET /v1/user/products', () => {
    it('should list all products successfully (no auth required)', async () => {
      const response = await request(app).get('/v1/user/products');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Products retrieved successfully.');
      expect(response.body.data.products).toHaveLength(5);
      expect(response.body.data.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 5,
        limit: 12,
        hasNextPage: false,
        hasPrevPage: false,
      });

      // Check if products include isInStock field
      expect(response.body.data.products[0]).toHaveProperty('isInStock');
    });

    it('should paginate products correctly', async () => {
      const response = await request(app).get('/v1/user/products?page=1&limit=3');

      expect(response.statusCode).toBe(200);
      expect(response.body.data.products).toHaveLength(3);
      expect(response.body.data.pagination.totalProducts).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPrevPage).toBe(false);
    });

    it('should filter products by category', async () => {
      const response = await request(app).get(`/v1/user/products?categoryId=${testCategoryId2}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Chocolate Chip Cookie');
      expect(response.body.data.products[0].category.name).toBe('Cookies');
    });

    it('should search products by name', async () => {
      const response = await request(app).get('/v1/user/products?search=cake');

      expect(response.statusCode).toBe(200);
      expect(response.body.data.products.length).toBeGreaterThan(0);

      // All results should contain "cake" in name or description
      response.body.data.products.forEach((product: any) => {
        const nameMatch = product.name.toLowerCase().includes('cake');
        const descMatch = product.description?.toLowerCase().includes('cake') || false;
        expect(nameMatch || descMatch).toBe(true);
      });
    });

    it('should filter products by price range', async () => {
      const response = await request(app).get('/v1/user/products?minPrice=1000&maxPrice=3000');

      expect(response.statusCode).toBe(200);
      expect(response.body.data.products.length).toBeGreaterThan(0);

      // All products should be within price range
      response.body.data.products.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(1000);
        expect(product.price).toBeLessThanOrEqual(3000);
      });
    });

    it('should filter products by stock availability', async () => {
      const response = await request(app).get('/v1/user/products?inStock=true');

      expect(response.statusCode).toBe(200);
      expect(response.body.data.products.length).toBe(4); // Should exclude out-of-stock Vanilla Cake

      // All products should be in stock
      response.body.data.products.forEach((product: any) => {
        expect(product.stock_quantity).toBeGreaterThan(0);
        expect(product.isInStock).toBe(true);
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request(app).get(
        `/v1/user/products?categoryId=${testCategoryId1}&inStock=true&maxPrice=3000`,
      );

      expect(response.statusCode).toBe(200);

      // Should only return Chocolate Cake and Strawberry Tart (both in stock, in Cakes category, under 3000)
      expect(response.body.data.products.length).toBe(2);
      response.body.data.products.forEach((product: any) => {
        expect(product.categoryId).toBe(testCategoryId1);
        expect(product.stock_quantity).toBeGreaterThan(0);
        expect(product.price).toBeLessThanOrEqual(3000);
      });
    });

    it('should fail with invalid pagination parameters', async () => {
      const response = await request(app).get('/v1/user/products?page=invalid&limit=999');

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Page must be a positive integer');
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request(app).get('/v1/user/products?search=nonexistentproduct');

      expect(response.statusCode).toBe(200);
      expect(response.body.data.products).toHaveLength(0);
      expect(response.body.data.pagination.totalProducts).toBe(0);
    });
  });
});
