import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from '../../../src/app';
import request from 'supertest';
import prisma from '../../../src/utils/prisma_connected';

describe('User API - Get Category by ID', () => {
  let testCategoryId: number;

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create a test category
    const testCategory = await prisma.category.create({
      data: { name: 'Electronics' },
    });

    testCategoryId = testCategory.id;
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  describe('GET /v1/user/categories/:id', () => {
    it('should get category by ID successfully without authentication', async () => {
      const response = await request(app).get(`/v1/user/categories/${testCategoryId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category retrieved successfully.');
      expect(response.body.data).toEqual({
        id: testCategoryId,
        name: 'Electronics',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      // Verify data types
      expect(typeof response.body.data.id).toBe('number');
      expect(typeof response.body.data.name).toBe('string');
      expect(typeof response.body.data.created_at).toBe('string');
      expect(typeof response.body.data.updated_at).toBe('string');
    });

    it('should fail with non-existent category ID', async () => {
      const nonExistentId = 999999;

      const response = await request(app).get(`/v1/user/categories/${nonExistentId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with invalid category ID format', async () => {
      const response = await request(app).get('/v1/user/categories/invalid-id');

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with negative category ID', async () => {
      const response = await request(app).get('/v1/user/categories/-1');

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should return correct response schema', async () => {
      const response = await request(app).get(`/v1/user/categories/${testCategoryId}`);

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

      // Verify boolean is true
      expect(response.body.success).toBe(true);

      // Verify dates are valid ISO strings
      expect(new Date(response.body.data.created_at)).toBeInstanceOf(Date);
      expect(new Date(response.body.data.updated_at)).toBeInstanceOf(Date);
    });
  });
});
