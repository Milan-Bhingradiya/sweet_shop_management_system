import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface AddCategoryRequestBody {
  name?: string;
}

/**
 * Creates a new category (Admin only).
 * @route POST /v1/admin/categories
 */
export const addCategory: RequestHandler<
  unknown,
  ApiResponse,
  AddCategoryRequestBody,
  unknown
> = async (req, res) => {
  try {
    const { name } = req.body;

    // --- 1. Handle Missing Request Body ---
    if (!req.body) {
      return res.status(400).json(createResponse(false, 'Request body is required.', null));
    }

    // --- 2. Input Validation ---
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

    // --- 3. Check for Duplicate Category (case-insensitive) ---
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      return res
        .status(409)
        .json(createResponse(false, 'Category with this name already exists.', null));
    }

    // --- 4. Create Category (without description) ---
    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
        // description will be null by default (optional field)
      },
    });

    // --- 5. Prepare Response Data ---
    const responseData = {
      id: newCategory.id,
      name: newCategory.name,
      created_at: newCategory.created_at.toISOString(),
      updated_at: newCategory.updated_at.toISOString(),
    };

    // --- 6. Send Success Response ---
    return res
      .status(201)
      .json(createResponse(true, 'Category created successfully.', responseData));
  } catch (error) {
    console.error('Add Category Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      // Handle unique constraint violation
      if (prismaError.code === 'P2002') {
        return res
          .status(409)
          .json(createResponse(false, 'Category with this name already exists.', null));
      }
    }

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
