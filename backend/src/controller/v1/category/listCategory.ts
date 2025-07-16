import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

/**
 * Retrieves all categories (Public endpoint - no authentication required).
 * @route GET /v1/categories
 */
export const listCategories: RequestHandler<unknown, ApiResponse, unknown, unknown> = async (
  req,
  res,
) => {
  try {
    // --- 1. Fetch All Categories from Database ---
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc', // Sort alphabetically by name
      },
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });

    // --- 2. Prepare Response Data ---
    const responseData = {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        created_at: category.created_at.toISOString(),
        updated_at: category.updated_at.toISOString(),
      })),
      total: categories.length,
    };

    // --- 3. Send Success Response ---
    return res
      .status(200)
      .json(createResponse(true, 'Categories retrieved successfully.', responseData));
  } catch (error) {
    console.error('List Categories Error:', error);

    // Handle any database or unexpected errors
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
