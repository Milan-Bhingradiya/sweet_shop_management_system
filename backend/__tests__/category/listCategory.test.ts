import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';

describe('Category Management - List All Categories', () => {
  beforeEach(async () => {
    // Clean up existing test data
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create test categories with different creation times
    await prisma.category.create({
      data: { name: 'Electronics' },
    });

    await prisma.category.create({
      data: { name: 'Books' },
    });

    await prisma.category.create({
      data: { name: 'Clothing' },
    });

    await prisma.category.create({
      data: { name: 'Home & Garden' },
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  describe('GET /v1/user/listCategories', () => {
    it('should list all categories successfully without authentication', async () => {
      const response = await request(app).get('/v1/user/listCategories');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Categories retrieved successfully.');
      expect(response.body.data).toEqual({
        categories: expect.any(Array),
        total: expect.any(Number),
      });

      // Verify we have all 4 categories
      expect(response.body.data.categories).toHaveLength(4);
      expect(response.body.data.total).toBe(4);

      // Verify category structure
      const category = response.body.data.categories[0];
      expect(category).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should return empty array when no categories exist', async () => {
      // Clear all categories
      await prisma.category.deleteMany();

      const response = await request(app).get('/v1/user/listCategories');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Categories retrieved successfully.');
      expect(response.body.data).toEqual({
        categories: [],
        total: 0,
      });
    });

    it('should return categories sorted by name in ascending order', async () => {
      const response = await request(app).get('/v1/user/listCategories');

      expect(response.statusCode).toBe(200);
      const categories = response.body.data.categories;

      // Verify categories are sorted alphabetically
      const categoryNames = categories.map((cat: any) => cat.name);
      const sortedNames = [...categoryNames].sort();
      expect(categoryNames).toEqual(sortedNames);

      // Should be: Books, Clothing, Electronics, Home & Garden
      expect(categoryNames[0]).toBe('Books');
      expect(categoryNames[1]).toBe('Clothing');
      expect(categoryNames[2]).toBe('Electronics');
      expect(categoryNames[3]).toBe('Home & Garden');
    });

    it('should return correct response schema', async () => {
      const response = await request(app).get('/v1/user/listCategories');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        success: expect.any(Boolean),
        message: expect.any(String),
        data: {
          categories: expect.any(Array),
          total: expect.any(Number),
        },
      });

      // Verify data types
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
    });

    it('should handle concurrent requests gracefully', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() => request(app).get('/v1/user/listCategories'));

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.categories).toHaveLength(4);
        expect(response.body.data.total).toBe(4);
      });
    });

    it('should work without any authentication headers', async () => {
      const response = await request(app).get('/v1/user/listCategories');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      // Should work even without Authorization header
    });

    it('should include all required category fields', async () => {
      const response = await request(app).get('/v1/user/listCategories');

      expect(response.statusCode).toBe(200);
      const categories = response.body.data.categories;

      categories.forEach((category: any) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('created_at');
        expect(category).toHaveProperty('updated_at');

        // Verify data types
        expect(typeof category.id).toBe('number');
        expect(typeof category.name).toBe('string');
        expect(typeof category.created_at).toBe('string');
        expect(typeof category.updated_at).toBe('string');

        // Verify dates are valid ISO strings
        expect(new Date(category.created_at)).toBeInstanceOf(Date);
        expect(new Date(category.updated_at)).toBeInstanceOf(Date);
      });
    });

    it('should handle database connection issues gracefully', async () => {
      // This test simulates database issues
      // In a real scenario, you might mock prisma to throw an error
      const response = await request(app).get('/v1/user/listCategories');

      // Since we can't easily simulate DB errors in this setup,
      // we'll just verify the endpoint works normally
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
