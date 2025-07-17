import type { RequestHandler, Request } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

interface AuthenticatedRequest
  extends Request<UpdateOrderStatusParams, ApiResponse, UpdateOrderStatusBody, unknown> {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

interface UpdateOrderStatusParams {
  id: string;
}

interface UpdateOrderStatusBody {
  status: 'PENDING' | 'COMPLETED';
}

/**
 * Updates order status (Admin only).
 * @route PUT /v1/admin/orders/:id/status
 */
export const updateOrderStatus: RequestHandler<
  UpdateOrderStatusParams,
  ApiResponse,
  UpdateOrderStatusBody,
  unknown
> = async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // --- 1. Validate order ID ---
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid order ID.', null));
    }

    // --- 2. Validate status ---
    if (!status || !['PENDING', 'COMPLETED'].includes(status)) {
      return res
        .status(400)
        .json(createResponse(false, 'Valid status is required (PENDING, COMPLETED).', null));
    }

    // --- 3. Check if order exists ---
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customer_name: true,
        token_number: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json(createResponse(false, 'Order not found.', null));
    }

    // --- 4. Update order status ---
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: {
        id: true,
        customer_name: true,
        phone_number: true,
        token_number: true,
        order_type: true,
        status: true,
        total_amount: true,
        created_at: true,
        address_line1: true,
        address_line2: true,
        city: true,
        pincode: true,
        landmark: true,
      },
    });

    // --- 5. Prepare response data ---
    const responseData = {
      id: updatedOrder.id,
      customer_name: updatedOrder.customer_name,
      phone_number: updatedOrder.phone_number,
      token_number: updatedOrder.token_number,
      order_type: updatedOrder.order_type,
      status: updatedOrder.status,
      total_amount: updatedOrder.total_amount,
      created_at: updatedOrder.created_at.toISOString(),
      address_line1: updatedOrder.address_line1,
      address_line2: updatedOrder.address_line2,
      city: updatedOrder.city,
      pincode: updatedOrder.pincode,
      landmark: updatedOrder.landmark,
    };

    return res
      .status(200)
      .json(createResponse(true, 'Order status updated successfully.', responseData));
  } catch (error) {
    console.error('💥 Update Order Status Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      if (prismaError.code === 'P2025') {
        return res.status(404).json(createResponse(false, 'Order not found.', null));
      }
    }

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
