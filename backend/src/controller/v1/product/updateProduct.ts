import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface UpdateProductRequestBody {
  name?: string;
  price?: number;
  description?: string;
  stock_quantity?: number;
  categoryId?: number;
  image_urls?: string[];
}

interface UpdateProductParams {
  id: string;
}

/**
 * Updates a product by ID (Admin only).
 * @route PUT /v1/admin/products/:id
 */
export const updateProduct: RequestHandler<
  UpdateProductParams,
  ApiResponse,
  UpdateProductRequestBody,
  unknown
> = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock_quantity, categoryId, image_urls } = req.body;

    // Validate product ID
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json(createResponse(false, 'Valid product ID is required.', null));
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json(createResponse(false, 'Product not found.', null));
    }

    // Validate fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res
          .status(400)
          .json(createResponse(false, 'Product name must be a non-empty string.', null));
      }
      if (name.trim().length > 255) {
        return res
          .status(400)
          .json(createResponse(false, 'Product name must be less than 255 characters.', null));
      }
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return res
          .status(400)
          .json(createResponse(false, 'Price must be a positive number.', null));
      }
    }

    if (stock_quantity !== undefined) {
      if (typeof stock_quantity !== 'number' || stock_quantity < 0) {
        return res
          .status(400)
          .json(createResponse(false, 'Stock quantity must be 0 or greater.', null));
      }
    }

    if (categoryId !== undefined) {
      if (typeof categoryId !== 'number') {
        return res.status(400).json(createResponse(false, 'Valid category ID is required.', null));
      }

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!existingCategory) {
        return res.status(404).json(createResponse(false, 'Category not found.', null));
      }
    }

    // Validate image URLs if provided
    if (image_urls !== undefined) {
      if (!Array.isArray(image_urls)) {
        return res.status(400).json(createResponse(false, 'Image URLs must be an array.', null));
      }

      if (image_urls.length > 5) {
        return res
          .status(400)
          .json(createResponse(false, 'Maximum 5 images allowed per product.', null));
      }

      const invalidUrls = image_urls.filter((url) => {
        if (typeof url !== 'string') return true;
        try {
          new URL(url);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidUrls.length > 0) {
        return res
          .status(400)
          .json(createResponse(false, 'All image URLs must be valid URLs.', null));
      }
    }

    // Check for duplicate name (if name is being updated)
    if (name !== undefined && name.trim().toLowerCase() !== existingProduct.name.toLowerCase()) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: 'insensitive',
          },
          id: {
            not: productId,
          },
        },
      });

      if (duplicateProduct) {
        return res
          .status(409)
          .json(createResponse(false, 'Product with this name already exists.', null));
      }
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (image_urls !== undefined) updateData.image_urls = image_urls;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const responseData = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      description: updatedProduct.description,
      stock_quantity: updatedProduct.stock_quantity,
      categoryId: updatedProduct.categoryId,
      category: updatedProduct.category,
      image_urls: updatedProduct.image_urls,
      created_at: updatedProduct.created_at.toISOString(),
    };

    return res
      .status(200)
      .json(createResponse(true, 'Product updated successfully.', responseData));
  } catch (error) {
    console.error('💥 Update Product Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      if (prismaError.code === 'P2002') {
        return res
          .status(409)
          .json(createResponse(false, 'Product with this name already exists.', null));
      }

      if (prismaError.code === 'P2003') {
        return res.status(404).json(createResponse(false, 'Category not found.', null));
      }
    }

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
