import type { RequestHandler, Request } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface CreateOrderRequestBody {
  customer_name: string;
  phone_number: string;
  order_type: 'DINE_IN' | 'DELIVERY';
  address_line1?: string;
  address_line2?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

interface AuthenticatedRequest
  extends Request<unknown, ApiResponse, CreateOrderRequestBody, unknown> {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Creates a new order for authenticated user.
 * @route POST /v1/user/orders
 */
export const createOrder: RequestHandler<
  unknown,
  ApiResponse,
  CreateOrderRequestBody,
  unknown
> = async (req: AuthenticatedRequest, res) => {
  try {
    const {
      customer_name,
      phone_number,
      order_type,
      address_line1,
      address_line2,
      city,
      pincode,
      landmark,
      items,
    } = req.body;

    // --- 1. Validate Authentication ---
    if (!req.user?.id) {
      return res.status(401).json(createResponse(false, 'Authentication required.', null));
    }

    // --- 2. Input Validation ---
    const missingFields: string[] = [];

    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim() === '') {
      missingFields.push('customer_name');
    }

    if (!phone_number || typeof phone_number !== 'string' || phone_number.trim() === '') {
      missingFields.push('phone_number');
    }

    if (!order_type || !['DINE_IN', 'DELIVERY'].includes(order_type)) {
      missingFields.push('order_type');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      missingFields.push('items');
    }

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json(createResponse(false, `Missing required fields: ${missingFields.join(', ')}.`, null));
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone_number)) {
      return res
        .status(400)
        .json(createResponse(false, 'Phone number must be exactly 10 digits.', null));
    }

    // --- 3. Validate Delivery Address ---
    if (order_type === 'DELIVERY') {
      const addressFields: string[] = [];

      if (!address_line1 || typeof address_line1 !== 'string' || address_line1.trim() === '') {
        addressFields.push('address_line1');
      }
      if (!city || typeof city !== 'string' || city.trim() === '') {
        addressFields.push('city');
      }
      if (!pincode || typeof pincode !== 'string' || pincode.trim() === '') {
        addressFields.push('pincode');
      }

      if (addressFields.length > 0) {
        return res
          .status(400)
          .json(
            createResponse(
              false,
              `Delivery orders require address fields: ${addressFields.join(', ')}.`,
              null,
            ),
          );
      }

      // Validate pincode format (basic validation for Indian pincodes)
      const pincodeRegex = /^[0-9]{6}$/;
      if (!pincodeRegex.test(pincode!)) {
        return res
          .status(400)
          .json(createResponse(false, 'Pincode must be exactly 6 digits.', null));
      }
    }

    // --- 4. Validate Order Items ---
    for (const item of items) {
      if (!item.product_id || typeof item.product_id !== 'number') {
        return res
          .status(400)
          .json(createResponse(false, 'Each item must have a valid product_id.', null));
      }

      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res
          .status(400)
          .json(createResponse(false, 'Each item must have a positive quantity.', null));
      }
    }

    // --- 5. Validate Products and Check Stock ---
    const productIds = items.map((item) => item.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        stock_quantity: true,
        image_urls: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      return res
        .status(404)
        .json(createResponse(false, `Product not found with IDs: ${missingIds.join(', ')}.`, null));
    }

    // Check stock availability and calculate total
    let totalAmount = 0;
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id)!;

      if (product.stock_quantity < item.quantity) {
        stockErrors.push(
          `${product.name} (available: ${product.stock_quantity}, requested: ${item.quantity})`,
        );
      }

      totalAmount += product.price * item.quantity;
    }

    if (stockErrors.length > 0) {
      return res
        .status(400)
        .json(createResponse(false, `Insufficient stock for: ${stockErrors.join(', ')}.`, null));
    }

    // --- 6. Generate Token Number ---
    // Get the highest token number for today and increment
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastOrder = await prisma.order.findFirst({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        token_number: 'desc',
      },
    });

    const tokenNumber = lastOrder ? lastOrder.token_number + 1 : 1;

    // --- 7. Create Order with Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
          customer_name: customer_name.trim(),
          phone_number: phone_number.trim(),
          token_number: tokenNumber,
          order_type,
          total_amount: totalAmount,
          address_line1: order_type === 'DELIVERY' ? address_line1?.trim() : null,
          address_line2: order_type === 'DELIVERY' ? address_line2?.trim() || null : null,
          city: order_type === 'DELIVERY' ? city?.trim() : null,
          pincode: order_type === 'DELIVERY' ? pincode?.trim() : null,
          landmark: order_type === 'DELIVERY' ? landmark?.trim() || null : null,
        },
      });

      // Create order items
      const orderItems = await Promise.all(
        items.map((item) => {
          const product = products.find((p) => p.id === item.product_id)!;
          return tx.orderItem.create({
            data: {
              order_id: newOrder.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: product.price,
            },
          });
        }),
      );

      // Update product stock
      await Promise.all(
        items.map((item) => {
          return tx.product.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: {
                decrement: item.quantity,
              },
            },
          });
        }),
      );

      return { order: newOrder, orderItems };
    });

    // --- 8. Fetch Complete Order Data ---
    const completeOrder = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        order_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image_urls: true,
              },
            },
          },
        },
      },
    });

    // --- 9. Prepare Response Data ---
    const responseData = {
      id: completeOrder!.id,
      userId: completeOrder!.userId,
      customer_name: completeOrder!.customer_name,
      phone_number: completeOrder!.phone_number,
      token_number: completeOrder!.token_number,
      order_type: completeOrder!.order_type,
      status: completeOrder!.status,
      total_amount: completeOrder!.total_amount,
      created_at: completeOrder!.created_at.toISOString(),
      address_line1: completeOrder!.address_line1,
      address_line2: completeOrder!.address_line2,
      city: completeOrder!.city,
      pincode: completeOrder!.pincode,
      landmark: completeOrder!.landmark,
      order_items: completeOrder!.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          image_urls: item.product.image_urls,
        },
      })),
    };

    // --- 10. Send Success Response ---
    return res.status(201).json(createResponse(true, 'Order created successfully.', responseData));
  } catch (error) {
    console.error('💥 Create Order Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      // Handle foreign key constraint violations
      if (prismaError.code === 'P2003') {
        return res
          .status(400)
          .json(createResponse(false, 'Invalid user or product reference.', null));
      }

      // Handle unique constraint violations (token number collision)
      if (prismaError.code === 'P2002') {
        return res
          .status(500)
          .json(createResponse(false, 'Order processing failed. Please try again.', null));
      }
    }

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
