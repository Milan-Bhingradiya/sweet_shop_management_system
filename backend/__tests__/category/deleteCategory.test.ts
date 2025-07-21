import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Category Management - Delete Category', () => {
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
  let testCategoryWithProductsId: number;

  // Setup: Create test users, tokens, and categories
  beforeEach(async () => {
    // Clean up existing test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Test Category', 'Category with Products', 'Another Category'],
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

    // Create test categories (removed description)
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
      },
    });

    const categoryWithProducts = await prisma.category.create({
      data: {
        name: 'Category with Products',
      },
    });

    testCategoryId = testCategory.id;
    testCategoryWithProductsId = categoryWithProducts.id;

    // Create a product in the category to test constraint
    await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 1000,
        description: 'Product for testing',
        image_urls: ['test.jpg'],
        stock_quantity: 10,
        categoryId: testCategoryWithProductsId,
      },
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Test Category', 'Category with Products', 'Another Category'],
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

  describe('DELETE /v1/admin/categories/:id', () => {
    it('should delete category successfully with valid admin token', async () => {
      const response = await request(app)
        .delete(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully.');
      expect(response.body.data).toEqual({
        id: testCategoryId,
        name: 'Test Category',
        deleted: true,
        deletedProductsCount: 0,
        deletedOrderItemsCount: 0,
      });

      // Verify category is deleted from database
      const deletedCategory = await prisma.category.findUnique({
        where: { id: testCategoryId },
      });
      expect(deletedCategory).toBeNull();
    });

    it('should fail without authentication token', async () => {
      const response = await request(app).delete(`/v1/admin/categories/${testCategoryId}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authorization header is required.');
    });

    it('should fail with customer token (insufficient permissions)', async () => {
      const response = await request(app)
        .delete(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required.');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .delete(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    it('should fail with non-existent category ID', async () => {
      const nonExistentId = 999999;

      const response = await request(app)
        .delete(`/v1/admin/categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with invalid category ID format', async () => {
      const response = await request(app)
        .delete('/v1/admin/categories/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with negative category ID', async () => {
      const response = await request(app)
        .delete('/v1/admin/categories/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should delete category that has products (cascade deletion)', async () => {
      const response = await request(app)
        .delete(`/v1/admin/categories/${testCategoryWithProductsId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully.');
      expect(response.body.data).toEqual({
        id: testCategoryWithProductsId,
        name: 'Category with Products',
        deleted: true,
        deletedProductsCount: 1, // One product was created in this category
        deletedOrderItemsCount: expect.any(Number),
      });

      // Verify category is deleted from database
      const deletedCategory = await prisma.category.findUnique({
        where: { id: testCategoryWithProductsId },
      });
      expect(deletedCategory).toBeNull();

      // Verify products in the category are also deleted
      const productsInCategory = await prisma.product.findMany({
        where: { categoryId: testCategoryWithProductsId },
      });
      expect(productsInCategory).toHaveLength(0);
    });

    it('should fail with zero as category ID', async () => {
      const response = await request(app)
        .delete('/v1/admin/categories/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should fail with decimal category ID', async () => {
      const response = await request(app)
        .delete('/v1/admin/categories/1.5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID format.');
      expect(response.body.data).toBe(null);
    });

    it('should return correct response schema for successful deletion', async () => {
      const response = await request(app)
        .delete(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        success: expect.any(Boolean),
        message: expect.any(String),
        data: {
          id: expect.any(Number),
          name: expect.any(String),
          deleted: expect.any(Boolean),
          deletedProductsCount: expect.any(Number),
          deletedOrderItemsCount: expect.any(Number),
        },
      });

      // Verify data types
      expect(typeof response.body.data.id).toBe('number');
      expect(typeof response.body.data.name).toBe('string');
      expect(typeof response.body.data.deleted).toBe('boolean');
      expect(typeof response.body.data.deletedProductsCount).toBe('number');
      expect(typeof response.body.data.deletedOrderItemsCount).toBe('number');
      expect(response.body.data.deleted).toBe(true);
    });

    it('should handle very large category ID gracefully', async () => {
      const largeId = 999999999999;

      const response = await request(app)
        .delete(`/v1/admin/categories/${largeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found.');
      expect(response.body.data).toBe(null);
    });

    it('should handle concurrent deletion requests gracefully', async () => {
      // Create multiple categories for concurrent deletion
      const category1 = await prisma.category.create({
        data: { name: 'Concurrent Test 1' },
      });
      const category2 = await prisma.category.create({
        data: { name: 'Concurrent Test 2' },
      });

      const promises = [
        request(app)
          .delete(`/v1/admin/categories/${category1.id}`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .delete(`/v1/admin/categories/${category2.id}`)
          .set('Authorization', `Bearer ${adminToken}`),
      ];

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.deleted).toBe(true);
      });

      // Verify both categories are deleted
      const deletedCat1 = await prisma.category.findUnique({
        where: { id: category1.id },
      });
      const deletedCat2 = await prisma.category.findUnique({
        where: { id: category2.id },
      });

      expect(deletedCat1).toBeNull();
      expect(deletedCat2).toBeNull();
    });

    it('should maintain database integrity after deletion', async () => {
      // Get initial category count
      const initialCount = await prisma.category.count();

      // Delete category
      await request(app)
        .delete(`/v1/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Verify count decreased by 1
      const finalCount = await prisma.category.count();
      expect(finalCount).toBe(initialCount - 1);

      // Verify specific category is gone
      const deletedCategory = await prisma.category.findUnique({
        where: { id: testCategoryId },
      });
      expect(deletedCategory).toBeNull();

      // Verify other categories still exist
      const otherCategory = await prisma.category.findUnique({
        where: { id: testCategoryWithProductsId },
      });
      expect(otherCategory).toBeTruthy();
    });
  });
});
