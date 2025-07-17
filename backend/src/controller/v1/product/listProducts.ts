import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

interface ListProductsQuery {
  page?: string;
  limit?: string;
  categoryId?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
}

/**
 * Lists products with filtering and pagination.
 * @route GET /v1/user/products (accessible by both users and admins)
 */
export const listProducts: RequestHandler<
  unknown,
  ApiResponse,
  unknown,
  ListProductsQuery
> = async (req, res) => {
  try {
    const { page = '1', limit = '12', categoryId, search, minPrice, maxPrice, inStock } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Validate pagination
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json(createResponse(false, 'Page must be a positive integer.', null));
    }

    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
      return res.status(400).json(createResponse(false, 'Limit must be between 1 and 50.', null));
    }

    const skip = (pageNumber - 1) * limitNumber;

    // Build filter conditions
    const where: any = {};

    // Category filter
    if (categoryId) {
      const categoryIdNumber = parseInt(categoryId, 10);
      if (!isNaN(categoryIdNumber)) {
        where.categoryId = categoryIdNumber;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};

      if (minPrice) {
        const minPriceNumber = parseInt(minPrice, 10);
        if (!isNaN(minPriceNumber)) {
          where.price.gte = minPriceNumber;
        }
      }

      if (maxPrice) {
        const maxPriceNumber = parseInt(maxPrice, 10);
        if (!isNaN(maxPriceNumber)) {
          where.price.lte = maxPriceNumber;
        }
      }
    }

    // Stock filter
    if (inStock === 'true') {
      where.stock_quantity = { gt: 0 };
    }

    // Get products with pagination
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    const responseData = {
      products: products.map((product) => ({
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
      })),
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProducts,
        limit: limitNumber,
        hasNextPage,
        hasPrevPage,
      },
    };

    return res
      .status(200)
      .json(createResponse(true, 'Products retrieved successfully.', responseData));
  } catch (error) {
    console.error('💥 List Products Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
