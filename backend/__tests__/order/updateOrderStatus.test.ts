import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Admin Order Management - Update Order Status', () => {
  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN' as const,
  };

  const customerUser = {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    role: 'CUSTOMER' as const,
  };

  let adminToken: string;
  let customerToken: string;
  let testCategoryId: number;
  let testProductId: number;
  let customerId: number;
  let testOrderId: number;

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

    const createdAdmin = await prisma.user.create({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        password: hashedAdminPassword,
        role: adminUser.role,
      },
    });

    const createdCustomer = await prisma.user.create({
      data: {
        name: customerUser.name,
        email: customerUser.email,
        password: hashedCustomerPassword,
        role: customerUser.role,
      },
    });
    customerId = createdCustomer.id;

    // Login users to get tokens
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

    // Create test category and product
    const testCategory = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    testCategoryId = testCategory.id;

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 1999,
        description: 'Test product description',
        stock_quantity: 50,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/product.jpg'],
      },
    });
    testProductId = product.id;

    // Create test order
    const order = await prisma.order.create({
      data: {
        userId: customerId,
        customer_name: 'John Doe',
        phone_number: '1234567890',
        token_number: 1,
        order_type: 'DINE_IN',
        status: 'PENDING',
        total_amount: 1999,
      },
    });
    testOrderId = order.id;

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: testProductId,
        quantity: 1,
        price: 1999,
      },
    });
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

  describe('PUT /v1/admin/orders/:id/status', () => {
    it('should update order status successfully with admin token', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order status updated successfully.');
      expect(response.body.data.id).toBe(testOrderId);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.customer_name).toBe('John Doe');
      expect(response.body.data.order_type).toBe('DINE_IN');

      // Verify the status was actually updated in database
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrderId },
      });
      expect(updatedOrder?.status).toBe('COMPLETED');
    });

    it('should update order status to COMPLETED', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PENDING' });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should fail with invalid status value', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid status is required');
    });

    it('should fail for non-existent order', async () => {
      const response = await request(app)
        .put('/v1/admin/orders/999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found.');
    });

    it('should fail without admin token', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .send({ status: 'COMPLETED' });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with customer token (non-admin)', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing status field', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid status is required');
    });

    it('should fail with invalid order ID format', async () => {
      const response = await request(app)
        .put('/v1/admin/orders/invalid/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid order ID');
    });
  });

  describe('GET /v1/admin/orders', () => {
    it('should list all orders for admin', async () => {
      const response = await request(app)
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Orders retrieved successfully.');
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination.totalOrders).toBe(1);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/v1/admin/orders?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('should fail without admin token', async () => {
      const response = await request(app).get('/v1/admin/orders');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with customer token', async () => {
      const response = await request(app)
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
