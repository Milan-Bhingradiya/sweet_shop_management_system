import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface GetCategoryByIdParams {
  id: string;
}

/**
 * Retrieves a category by ID (Public endpoint - no authentication required).
 * @route GET /v1/user/categories/:id
 */
export const getCategoryById: RequestHandler<
  GetCategoryByIdParams,
  ApiResponse,
  unknown,
  unknown
> = async (req, res) => {
  try {
    const { id } = req.params;

    // --- 1. Validate Category ID Format ---
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId) || categoryId <= 0 || !Number.isInteger(Number(id))) {
      return res.status(400).json(createResponse(false, 'Invalid category ID format.', null));
    }

    // --- 2. Check for PostgreSQL INT4 range (32-bit signed integer) ---
    if (categoryId > 2147483647 || categoryId < -2147483648) {
      return res.status(404).json(createResponse(false, 'Category not found.', null));
    }

    // --- 3. Fetch Category from Database ---
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });

    // --- 4. Check if Category Exists ---
    if (!category) {
      return res.status(404).json(createResponse(false, 'Category not found.', null));
    }

    // --- 5. Prepare Response Data ---
    const responseData = {
      id: category.id,
      name: category.name,
      created_at: category.created_at.toISOString(),
      updated_at: category.updated_at.toISOString(),
    };

    // --- 6. Send Success Response ---
    return res
      .status(200)
      .json(createResponse(true, 'Category retrieved successfully.', responseData));
  } catch (error) {
    console.error('Get Category By ID Error:', error);

    // Handle database conversion errors (e.g., integer overflow)
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string;
      if (
        errorMessage.includes('Unable to fit integer value') ||
        errorMessage.includes('INT4') ||
        errorMessage.includes('ConversionError')
      ) {
        return res.status(404).json(createResponse(false, 'Category not found.', null));
      }
    }

    // Handle any database or unexpected errors
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
