import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('Order Management - Additional Endpoints', () => {
  const customerUser = {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    role: 'CUSTOMER' as const,
  };

  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN' as const,
  };

  let customerToken: string;
  let adminToken: string;
  let testCategoryId: number;
  let testProductId: number;
  let customerId: number;
  let testOrderId: number;

  beforeEach(async () => {
    // Clean up
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    const hashedCustomerPassword = await bcrypt.hash(customerUser.password, 10);
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);

    const createdCustomer = await prisma.user.create({
      data: {
        name: customerUser.name,
        email: customerUser.email,
        password: hashedCustomerPassword,
        role: customerUser.role,
      },
    });
    customerId = createdCustomer.id;

    await prisma.user.create({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        password: hashedAdminPassword,
        role: adminUser.role,
      },
    });

    // Login users
    const customerLoginResponse = await request(app).post('/v1/auth/login').send({
      email: customerUser.email,
      password: customerUser.password,
    });
    customerToken = customerLoginResponse.body.data.token;

    const adminLoginResponse = await request(app).post('/v1/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });
    adminToken = adminLoginResponse.body.data.token;

    // Create test data
    const testCategory = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    testCategoryId = testCategory.id;

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 1000,
        description: 'Test product',
        stock_quantity: 10,
        categoryId: testCategoryId,
        image_urls: ['test.jpg'],
      },
    });
    testProductId = product.id;

    // Create a test order
    const order = await prisma.order.create({
      data: {
        userId: customerId,
        customer_name: 'Test Customer',
        phone_number: '1234567890',
        token_number: 1,
        order_type: 'DINE_IN',
        status: 'PENDING',
        total_amount: 1000,
      },
    });
    testOrderId = order.id;

    await prisma.orderItem.create({
      data: {
        order_id: testOrderId,
        product_id: testProductId,
        quantity: 1,
        price: 1000,
      },
    });
  });

  afterEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /v1/user/orders', () => {
    it('should list user orders successfully', async () => {
      const response = await request(app)
        .get('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].id).toBe(testOrderId);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/v1/user/orders');
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /v1/user/orders/:id', () => {
    it('should get order by ID successfully', async () => {
      const response = await request(app)
        .get(`/v1/user/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrderId);
    });

    it('should fail for non-existent order', async () => {
      const response = await request(app)
        .get('/v1/user/orders/999999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /v1/admin/orders', () => {
    it('should list all orders for admin', async () => {
      const response = await request(app)
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /v1/admin/orders/:id/status', () => {
    it('should update order status successfully', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/v1/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID' });

      expect(response.statusCode).toBe(400);
    });
  });
});
