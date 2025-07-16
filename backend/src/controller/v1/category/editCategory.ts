import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface EditCategoryParams {
  id: string;
}

export interface EditCategoryRequestBody {
  name?: string;
}

/**
 * Updates a category by ID (Admin only).
 * @route PUT /v1/admin/categories/:id
 */
export const editCategory: RequestHandler<
  EditCategoryParams,
  ApiResponse,
  EditCategoryRequestBody,
  unknown
> = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // --- 1. Handle Missing Request Body ---
    if (!req.body) {
      return res.status(400).json(createResponse(false, 'Request body is required.', null));
    }

    // --- 2. Validate Category ID Format ---
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId) || categoryId <= 0 || !Number.isInteger(Number(id))) {
      return res.status(400).json(createResponse(false, 'Invalid category ID format.', null));
    }

    // --- 3. Check for PostgreSQL INT4 range (32-bit signed integer) ---
    if (categoryId > 2147483647 || categoryId < -2147483648) {
      return res.status(404).json(createResponse(false, 'Category not found.', null));
    }

    // --- 4. Input Validation ---
    // Check if name exists and is a string
    if (name === undefined || name === null) {
      return res.status(400).json(createResponse(false, 'Category name is required.', null));
    }

    if (typeof name !== 'string') {
      return res.status(400).json(createResponse(false, 'Category name must be a string.', null));
    }

    const trimmedName = name.trim();

    // Check for empty string after trimming
    if (trimmedName === '') {
      return res.status(400).json(createResponse(false, 'Category name is required.', null));
    }

    // Check length limit
    if (trimmedName.length > 255) {
      return res
        .status(400)
        .json(createResponse(false, 'Category name must be less than 255 characters.', null));
    }

    // --- 5. Check if Category Exists ---
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json(createResponse(false, 'Category not found.', null));
    }

    // --- 6. Check for Duplicate Category (case-insensitive, excluding current category) ---
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
        id: {
          not: categoryId, // Exclude current category from duplicate check
        },
      },
    });

    if (duplicateCategory) {
      return res
        .status(409)
        .json(createResponse(false, 'Category with this name already exists.', null));
    }

    // --- 7. Update Category ---
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: trimmedName,
      },
    });

    // --- 8. Prepare Response Data ---
    const responseData = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      created_at: updatedCategory.created_at.toISOString(),
      updated_at: updatedCategory.updated_at.toISOString(),
    };

    // --- 9. Send Success Response ---
    return res
      .status(200)
      .json(createResponse(true, 'Category updated successfully.', responseData));
  } catch (error) {
    console.error('Edit Category Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      // Handle unique constraint violation
      if (prismaError.code === 'P2002') {
        return res
          .status(409)
          .json(createResponse(false, 'Category with this name already exists.', null));
      }

      // Handle record not found during update
      if (prismaError.code === 'P2025') {
        return res.status(404).json(createResponse(false, 'Category not found.', null));
      }
    }

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

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
