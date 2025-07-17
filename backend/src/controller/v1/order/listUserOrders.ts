import type { RequestHandler, Request } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

interface ListOrdersQuery {
  page?: string;
  limit?: string;
  status?: 'PENDING' | 'READY' | 'COMPLETED';
}

interface AuthenticatedRequest extends Request<unknown, ApiResponse, unknown, ListOrdersQuery> {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Lists orders for authenticated user with pagination and filtering.
 * @route GET /v1/user/orders
 */
export const listUserOrders: RequestHandler<
  unknown,
  ApiResponse,
  unknown,
  ListOrdersQuery
> = async (req: AuthenticatedRequest, res) => {
  try {
    // --- 1. Validate Authentication ---
    if (!req.user?.id) {
      return res.status(401).json(createResponse(false, 'Authentication required.', null));
    }

    const { page = '1', limit = '10', status } = req.query;

    // --- 2. Parse and Validate Pagination ---
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json(createResponse(false, 'Page must be a positive integer.', null));
    }

    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
      return res.status(400).json(createResponse(false, 'Limit must be between 1 and 50.', null));
    }

    const skip = (pageNumber - 1) * limitNumber;

    // --- 3. Build Filter Conditions ---
    const where: any = {
      userId: req.user.id,
    };

    if (status && ['PENDING', 'READY', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    // --- 4. Fetch Orders with Pagination ---
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

    // --- 5. Calculate Pagination Info ---
    const totalPages = Math.ceil(totalOrders / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // --- 6. Prepare Response Data ---
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
      total: totalOrders,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalOrders,
        limit: limitNumber,
        hasNextPage,
        hasPrevPage,
      },
    };

    // --- 7. Send Success Response ---
    return res
      .status(200)
      .json(createResponse(true, 'Orders retrieved successfully.', responseData));
  } catch (error) {
    console.error('💥 List User Orders Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
