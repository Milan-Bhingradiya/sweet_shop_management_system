import type { RequestHandler } from 'express';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';
import { verifyToken } from 'middleware/jwtUtility';
import jwt from 'jsonwebtoken';

export const verifyJWT: RequestHandler<unknown, ApiResponse, unknown, unknown> = async (
  req,
  res,
) => {
  try {
    // --- 1. Extract token from Authorization header ---
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json(
        createResponse(false, 'Authorization header is required.', {
          valid: false,
          user: null,
        }),
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createResponse(false, 'Bearer token is required.', {
          valid: false,
          user: null,
        }),
      );
    }

    // --- 2. Extract and validate token ---
    const authParts = authHeader.split(' ');
    if (authParts.length !== 2 || !authParts[1] || authParts[1].trim() === '') {
      return res.status(401).json(
        createResponse(false, 'Token is required.', {
          valid: false,
          user: null,
        }),
      );
    }

    const token = authParts[1].trim();

    // --- 3. Verify JWT Token ---
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      let errorMessage = 'Invalid token.';

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired.';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token.';
      }

      return res.status(401).json(
        createResponse(false, errorMessage, {
          valid: false,
          user: null,
        }),
      );
    }

    // --- 4. Check if User Still Exists in Database ---
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json(
        createResponse(false, 'User not found.', {
          valid: false,
          user: null,
        }),
      );
    }

    // --- 5. Prepare User Response (exclude password) ---
    const userForResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    // --- 6. Send Success Response ---
    return res.status(200).json(
      createResponse(true, 'Token is valid.', {
        valid: true,
        user: userForResponse,
      }),
    );
  } catch (error) {
    console.error('Token Verification Error:', error);
    return res.status(500).json(
      createResponse(false, 'An unexpected error occurred.', {
        valid: false,
        user: null,
      }),
    );
  }
};
