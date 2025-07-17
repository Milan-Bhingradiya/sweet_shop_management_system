import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('User Order Management - List and Get Orders', () => {
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
  let testOrderId1: number;
  let testOrderId2: number;

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

    // Create test orders
    const order1 = await prisma.order.create({
      data: {
        userId: customerId,
        customer_name: 'John Doe',
        phone_number: '1234567890',
        token_number: 1,
        order_type: 'DINE_IN',
        status: 'PENDING',
        total_amount: 3998,
      },
    });
    testOrderId1 = order1.id;

    await prisma.orderItem.create({
      data: {
        order_id: order1.id,
        product_id: testProductId,
        quantity: 2,
        price: 1999,
      },
    });

    const order2 = await prisma.order.create({
      data: {
        userId: customerId,
        customer_name: 'Jane Smith',
        phone_number: '9876543210',
        token_number: 2,
        order_type: 'DELIVERY',
        status: 'READY',
        total_amount: 1999,
        address_line1: '123 Main St',
        city: 'Mumbai',
        pincode: '400001',
      },
    });
    testOrderId2 = order2.id;

    await prisma.orderItem.create({
      data: {
        order_id: order2.id,
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

  describe('GET /v1/user/orders', () => {
    it('should list user orders successfully with valid customer token', async () => {
      const response = await request(app)
        .get('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Orders retrieved successfully.');
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      
      // Check order structure
      const order = response.body.data.orders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('customer_name');
      expect(order).toHaveProperty('token_number');
      expect(order).toHaveProperty('order_type');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('total_amount');
      expect(order).toHaveProperty('created_at');
      expect(order).toHaveProperty('order_items');
    }, 10000);

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/v1/user/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    }, 10000);

    it('should filter by order status', async () => {
      const response = await request(app)
        .get('/v1/user/orders?status=READY')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('READY');
    }, 10000);

    it('should fail without authentication', async () => {
      const response = await request(app).get('/v1/user/orders');

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    }, 10000);
  });

  describe('GET /v1/user/orders/:id', () => {
    it('should get order details successfully', async () => {
      const response = await request(app)
        .get(`/v1/user/orders/${testOrderId1}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order details retrieved successfully.');
      expect(response.body.data).toEqual({
        id: testOrderId1,
        userId: customerId,
        customer_name: 'John Doe',
        phone_number: '1234567890',
        token_number: 1,
        order_type: 'DINE_IN',
        status: 'PENDING',
        total_amount: 3998,
        created_at: expect.any(String),
        address_line1: null,
        address_line2: null,
        city: null,
        pincode: null,
        landmark: null,
        order_items: [
          {
            id: expect.any(Number),
            product_id: testProductId,
            quantity: 2,
            price: 1999,
            product: {
              id: testProductId,
              name: 'Test Product',
              image_urls: ['https://example.com/product.jpg'],
            },
          },
        ],
      });
    }, 10000);

    it('should fail for non-existent order', async () => {
      const response = await request(app)
        .get('/v1/user/orders/999999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found.');
    }, 10000);

    it('should fail for order belonging to different user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          password: await bcrypt.hash('password123', 10),
          role: 'CUSTOMER',
        },
      });

      const otherLoginResponse = await request(app).post('/v1/auth/login').send({
        email: 'other@example.com',
        password: 'password123',
      });

      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(app)
        .get(`/v1/user/orders/${testOrderId1}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found.');
    }, 10000);

    it('should fail without authentication', async () => {
      const response = await request(app).get(`/v1/user/orders/${testOrderId1}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
