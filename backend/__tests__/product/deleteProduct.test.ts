import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Product Management - Delete Product', () => {
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
          in: [adminUser.email, customerUser.email, 'order@example.com'],
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
        name: 'Product to Delete',
        price: 1999,
        description: 'Product that will be deleted',
        stock_quantity: 50,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/delete-me.jpg'],
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
          in: [adminUser.email, customerUser.email, 'order@example.com'],
        },
      },
    });
  });

  describe('DELETE /v1/admin/products/:id', () => {
    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully.');
      expect(response.body.data).toEqual({
        id: testProductId,
        name: 'Product to Delete',
        deleted_at: expect.any(String),
      });

      // Verify product was deleted from database
      const deletedProduct = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should fail without authentication token', async () => {
      const response = await request(app).delete(`/v1/admin/products/${testProductId}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with customer token (non-admin)', async () => {
      const response = await request(app)
        .delete(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid product ID', async () => {
      const response = await request(app)
        .delete('/v1/admin/products/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid product ID is required');
    });

    it('should fail with non-existent product ID', async () => {
      const response = await request(app)
        .delete('/v1/admin/products/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found.');
    });

    it('should fail to delete product referenced in orders', async () => {
      // Create a user and order with the product
      const user = await prisma.user.create({
        data: {
          name: 'Order User',
          email: 'order@example.com',
          password: 'password123',
          role: 'CUSTOMER',
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          phone_number: '1234567890',
          customer_name: 'Order User',
          total_amount: 1999,
          status: 'PENDING',
          order_type: 'DELIVERY',
          token_number: 1, // ← REQUIRED FIELD
        },
      });

      await prisma.orderItem.create({
        data: {
          order_id: order.id,
          product_id: testProductId,
          quantity: 1,
          price: 1999,
        },
      });

      // Try to delete product
      const response = await request(app)
        .delete(`/v1/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Cannot delete product. It is referenced in existing orders',
      );

      // Verify product still exists
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(product).not.toBeNull();
    });
  });
});
