import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

interface DeleteProductParams {
  id: string;
}

/**
 * Deletes a product by ID (Admin only).
 * @route DELETE /v1/admin/products/:id
 */
export const deleteProduct: RequestHandler<
  DeleteProductParams,
  ApiResponse,
  unknown,
  unknown
> = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate product ID
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json(createResponse(false, 'Valid product ID is required.', null));
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        order_items: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json(createResponse(false, 'Product not found.', null));
    }

    // Check if product is referenced in orders
    if (existingProduct.order_items.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            'Cannot delete product. It is referenced in existing orders.',
            null,
          ),
        );
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    const responseData = {
      id: productId,
      name: existingProduct.name,
      deleted_at: new Date().toISOString(),
    };

    return res
      .status(200)
      .json(createResponse(true, 'Product deleted successfully.', responseData));
  } catch (error) {
    console.error('💥 Delete Product Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      // Handle foreign key constraint violations
      if (prismaError.code === 'P2003') {
        return res
          .status(400)
          .json(
            createResponse(
              false,
              'Cannot delete product. It is referenced by other records.',
              null,
            ),
          );
      }
    }

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
