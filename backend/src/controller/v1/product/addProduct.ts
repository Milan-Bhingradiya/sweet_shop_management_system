import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface AddProductRequestBody {
  name: string;
  price: number;
  description?: string;
  stock_quantity: number;
  categoryId: number;
  image_urls?: string[]; // URLs provided by frontend
}

/**
 * Adds a new product with image URLs (Admin only).
 * @route POST /v1/admin/products
 */
export const addProduct: RequestHandler<
  unknown,
  ApiResponse,
  AddProductRequestBody,
  unknown
> = async (req, res) => {
  try {
    const { name, price, description, stock_quantity, categoryId, image_urls } = req.body;

    // --- 1. Input Validation ---
    const missingFields: string[] = [];

    if (!name || typeof name !== 'string' || name.trim() === '') {
      missingFields.push('name');
    }

    if (price === undefined || price === null) {
      missingFields.push('price');
    }

    if (stock_quantity === undefined || stock_quantity === null) {
      missingFields.push('stock_quantity');
    }

    if (!categoryId) {
      missingFields.push('categoryId');
    }

    // Return missing fields error first
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json(createResponse(false, `Missing required fields: ${missingFields.join(', ')}.`, null));
    }

    // Validate field values
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json(createResponse(false, 'Price must be a positive number.', null));
    }

    if (typeof stock_quantity !== 'number' || stock_quantity < 0) {
      return res
        .status(400)
        .json(createResponse(false, 'Stock quantity must be 0 or greater.', null));
    }

    if (typeof categoryId !== 'number') {
      return res.status(400).json(createResponse(false, 'Valid category ID is required.', null));
    }

    const trimmedName = name.trim();

    // Check name length
    if (trimmedName.length > 255) {
      return res
        .status(400)
        .json(createResponse(false, 'Product name must be less than 255 characters.', null));
    }

    // Validate image URLs if provided
    if (image_urls && Array.isArray(image_urls)) {
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

      if (image_urls.length > 5) {
        return res
          .status(400)
          .json(createResponse(false, 'Maximum 5 images allowed per product.', null));
      }
    }

    // --- 2. Check if Category Exists ---
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json(createResponse(false, 'Category not found.', null));
    }

    // --- 3. Check for Duplicate Product Name ---
    const duplicateProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (duplicateProduct) {
      return res
        .status(409)
        .json(createResponse(false, 'Product with this name already exists.', null));
    }

    // --- 4. Create Product in Database ---
    const newProduct = await prisma.product.create({
      data: {
        name: trimmedName,
        price: price,
        description: description?.trim() || null,
        stock_quantity: stock_quantity,
        categoryId: categoryId,
        image_urls: image_urls || [], // Use provided URLs or empty array
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // --- 5. Prepare Response Data ---
    const responseData = {
      id: newProduct.id,
      name: newProduct.name,
      price: newProduct.price,
      description: newProduct.description,
      stock_quantity: newProduct.stock_quantity,
      categoryId: newProduct.categoryId,
      category: newProduct.category,
      image_urls: newProduct.image_urls,
      created_at: newProduct.created_at.toISOString(),
    };

    // --- 6. Send Success Response ---
    return res.status(201).json(createResponse(true, 'Product added successfully.', responseData));
  } catch (error) {
    console.error('💥 Add Product Error:', error);

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      // Handle unique constraint violation
      if (prismaError.code === 'P2002') {
        return res
          .status(409)
          .json(createResponse(false, 'Product with this name already exists.', null));
      }

      // Handle foreign key constraint violation (category not found)
      if (prismaError.code === 'P2003') {
        return res.status(404).json(createResponse(false, 'Category not found.', null));
      }
    }

    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
