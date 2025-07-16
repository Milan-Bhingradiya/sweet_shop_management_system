import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface DeleteCategoryParams {
  id: string;
}

/**
 * Deletes a category by ID (Admin only).
 * @route DELETE /v1/admin/categories/:id
 */
export const deleteCategory: RequestHandler<
  DeleteCategoryParams,
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

    // --- 3. Check if Category Exists ---
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true, // Include products to check if category has products
      },
    });

    if (!existingCategory) {
      return res.status(404).json(createResponse(false, 'Category not found.', null));
    }

    // --- 4. Check if Category Has Products ---
    if (existingCategory.products && existingCategory.products.length > 0) {
      return res
        .status(409)
        .json(
          createResponse(
            false,
            'Cannot delete category that contains products. Please move or delete products first.',
            null,
          ),
        );
    }

    // --- 5. Delete Category ---
    await prisma.category.delete({
      where: { id: categoryId },
    });

    // --- 6. Send Success Response ---
    return res.status(200).json(
      createResponse(true, 'Category deleted successfully.', {
        id: existingCategory.id,
        name: existingCategory.name,
        deleted: true,
      }),
    );
  } catch (error) {
    console.error('Delete Category Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      // Handle foreign key constraint violation
      if (prismaError.code === 'P2003') {
        return res
          .status(409)
          .json(
            createResponse(
              false,
              'Cannot delete category that contains products. Please move or delete products first.',
              null,
            ),
          );
      }

      // Handle record not found during deletion
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
