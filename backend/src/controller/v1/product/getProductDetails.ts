import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

interface GetProductParams {
  id: string;
}

/**
 * Gets product details by ID.
 * @route GET /v1/user/products/:id (accessible by both users and admins)
 */
export const getProductDetails: RequestHandler<
  GetProductParams,
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

    // Find product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json(createResponse(false, 'Product not found.', null));
    }

    const responseData = {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      stock_quantity: product.stock_quantity,
      categoryId: product.categoryId,
      category: product.category,
      image_urls: product.image_urls,
      created_at: product.created_at.toISOString(),
      isInStock: product.stock_quantity > 0,
    };

    return res
      .status(200)
      .json(createResponse(true, 'Product details retrieved successfully.', responseData));
  } catch (error) {
    console.error('💥 Get Product Details Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
