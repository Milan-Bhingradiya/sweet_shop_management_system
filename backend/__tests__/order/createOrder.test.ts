import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import app from 'app';
import request from 'supertest';
import prisma from '@utils/prisma_connected';
import bcrypt from 'bcrypt';

describe('User Order Management - Create Order', () => {
  const customerUser = {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    role: 'CUSTOMER' as const,
  };

  let customerToken: string;
  let testCategoryId: number;
  let testProductId1: number;
  let testProductId2: number;
  let customerId: number;

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [customerUser.email],
        },
      },
    });

    // Create test user
    const hashedCustomerPassword = await bcrypt.hash(customerUser.password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name: customerUser.name,
        email: customerUser.email,
        password: hashedCustomerPassword,
        role: customerUser.role,
      },
    });
    customerId = createdUser.id;

    // Login customer to get token
    const customerLoginResponse = await request(app).post('/v1/auth/login').send({
      email: customerUser.email,
      password: customerUser.password,
    });

    customerToken = customerLoginResponse.body.data.token;

    // Create test category
    const testCategory = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    testCategoryId = testCategory.id;

    // Create test products
    const product1 = await prisma.product.create({
      data: {
        name: 'Chocolate Cake',
        price: 2999,
        description: 'Delicious chocolate cake',
        stock_quantity: 10,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/cake.jpg'],
      },
    });
    testProductId1 = product1.id;

    const product2 = await prisma.product.create({
      data: {
        name: 'Vanilla Cupcake',
        price: 299,
        description: 'Sweet vanilla cupcake',
        stock_quantity: 20,
        categoryId: testCategoryId,
        image_urls: ['https://example.com/cupcake.jpg'],
      },
    });
    testProductId2 = product2.id;
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
          in: [customerUser.email],
        },
      },
    });
  });

  describe('POST /v1/user/orders', () => {
    it('should create dine-in order successfully with valid customer token', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone_number: '1234567890',
        order_type: 'DINE_IN',
        items: [
          {
            product_id: testProductId1,
            quantity: 2,
          },
          {
            product_id: testProductId2,
            quantity: 3,
          },
        ],
      };

      const response = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order created successfully.');
      expect(response.body.data).toEqual({
        id: expect.any(Number),
        userId: customerId,
        customer_name: 'John Doe',
        phone_number: '1234567890',
        token_number: expect.any(Number),
        order_type: 'DINE_IN',
        status: 'PENDING',
        total_amount: 6895, // (2999 * 2) + (299 * 3) = 5998 + 897 = 6895
        created_at: expect.any(String),
        address_line1: null,
        address_line2: null,
        city: null,
        pincode: null,
        landmark: null,
        order_items: [
          {
            id: expect.any(Number),
            product_id: testProductId1,
            quantity: 2,
            price: 2999,
            product: {
              id: testProductId1,
              name: 'Chocolate Cake',
              image_urls: ['https://example.com/cake.jpg'],
            },
          },
          {
            id: expect.any(Number),
            product_id: testProductId2,
            quantity: 3,
            price: 299,
            product: {
              id: testProductId2,
              name: 'Vanilla Cupcake',
              image_urls: ['https://example.com/cupcake.jpg'],
            },
          },
        ],
      });
    });

    it('should create delivery order successfully with address', async () => {
      const orderData = {
        customer_name: 'Jane Smith',
        phone_number: '9876543210',
        order_type: 'DELIVERY',
        address_line1: '123 Main St',
        address_line2: 'Apt 4B',
        city: 'Mumbai',
        pincode: '400001',
        landmark: 'Near Central Mall',
        items: [
          {
            product_id: testProductId1,
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order_type).toBe('DELIVERY');
      expect(response.body.data.address_line1).toBe('123 Main St');
      expect(response.body.data.city).toBe('Mumbai');
      expect(response.body.data.total_amount).toBe(2999);
    });

    it('should fail without authentication', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone_number: '1234567890',
        order_type: 'DINE_IN',
        items: [
          {
            product_id: testProductId1,
            quantity: 1,
          },
        ],
      };

      const response = await request(app).post('/v1/user/orders').send(orderData);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customer_name: 'John Doe',
          // Missing required fields
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail with invalid product ID', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone_number: '1234567890',
        order_type: 'DINE_IN',
        items: [
          {
            product_id: 999999, // Non-existent product
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail with insufficient stock', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone_number: '1234567890',
        order_type: 'DINE_IN',
        items: [
          {
            product_id: testProductId1,
            quantity: 50, // More than available stock (10)
          },
        ],
      };

      const response = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should fail with delivery order missing address', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone_number: '1234567890',
        order_type: 'DELIVERY',
        // Missing address fields
        items: [
          {
            product_id: testProductId1,
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('address');
    });

    it('should generate unique token numbers for multiple orders', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone_number: '1234567890',
        order_type: 'DINE_IN',
        items: [
          {
            product_id: testProductId1,
            quantity: 1,
          },
        ],
      };

      // Create first order
      const response1 = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      // Create second order
      const response2 = await request(app)
        .post('/v1/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response1.statusCode).toBe(201);
      expect(response2.statusCode).toBe(201);
      expect(response1.body.data.token_number).not.toBe(response2.body.data.token_number);
    });
  });
});
