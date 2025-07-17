import type { RequestHandler, Request } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

interface AuthenticatedRequest extends Request<unknown, ApiResponse, unknown, ListOrdersQuery> {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

interface ListOrdersQuery {
  page?: string;
  limit?: string;
  status?: string;
  order_type?: string;
}

/**
 * Lists orders for the authenticated user with pagination and filtering.
 * @route GET /v1/user/orders
 */
export const listOrders: RequestHandler<unknown, ApiResponse, unknown, ListOrdersQuery> = async (
  req: AuthenticatedRequest,
  res,
) => {
  try {
    const { page = '1', limit = '10', status, order_type } = req.query;

    // --- 1. Validate Authentication ---
    if (!req.user?.id) {
      return res.status(401).json(createResponse(false, 'Authentication required.', null));
    }

    // --- 2. Parse and validate pagination ---
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json(createResponse(false, 'Page must be a positive integer.', null));
    }

    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
      return res.status(400).json(createResponse(false, 'Limit must be between 1 and 50.', null));
    }

    const skip = (pageNumber - 1) * limitNumber;

    // --- 3. Build filter conditions ---
    const where: any = {
      userId: req.user.id, // Only user's own orders
    };

    if (status && ['PENDING', 'READY', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    if (order_type && ['DINE_IN', 'DELIVERY'].includes(order_type)) {
      where.order_type = order_type;
    }

    // --- 4. Fetch orders with pagination ---
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNumber,
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
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);

    // --- 5. Calculate pagination info ---
    const totalPages = Math.ceil(totalOrders / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // --- 6. Prepare response data ---
    const responseData = {
      orders: orders.map((order) => ({
        id: order.id,
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
      })),
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalOrders,
        limit: limitNumber,
        hasNextPage,
        hasPrevPage,
      },
    };

    return res
      .status(200)
      .json(createResponse(true, 'Orders retrieved successfully.', responseData));
  } catch (error) {
    console.error('💥 List Orders Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
