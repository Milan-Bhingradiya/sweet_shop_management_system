import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

/**
 * Gets order details by ID for authenticated user.
 * @route GET /v1/user/orders/:id
 */
export const getUserOrderById: RequestHandler = async (req: any, res) => {
  try {
    // --- 1. Validate Authentication ---
    if (!req.user?.id) {
      return res.status(401).json(createResponse(false, 'Authentication required.', null));
    }

    const { id } = req.params;

    // --- 2. Validate Order ID ---
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid order ID format.', null));
    }

    // --- 3. Fetch Order ---
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id, // Ensure user can only access their own orders
      },
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

    // --- 4. Check if Order Exists ---
    if (!order) {
      return res.status(404).json(createResponse(false, 'Order not found.', null));
    }

    // --- 5. Prepare Response Data ---
    const responseData = {
      id: order.id,
      userId: order.userId,
      customer_name: order.customer_name,
      phone_number: order.phone_number,
      token_number: order.token_number,
      order_type: order.order_type,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at.toISOString(),
      address_line1: order.address_line1,
      address_line2: order.address_line2,
      city: order.city,
      pincode: order.pincode,
      landmark: order.landmark,
      order_items: order.order_items.map((item) => ({
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

    // --- 6. Send Success Response ---
    return res
      .status(200)
      .json(createResponse(true, 'Order details retrieved successfully.', responseData));
  } catch (error) {
    console.error('💥 Get User Order By ID Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
