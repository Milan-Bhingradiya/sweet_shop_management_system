import type { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';
import { generateToken } from 'middleware/jwtUtility';

export interface LoginRequestBody {
  email?: string;
  password?: string;
}

// Email format validation
const isInvalidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailRegex.test(email);
};

/**
 * Handles user login with email and password.
 * @route POST /v1/auth/login
 */
export const loginUser: RequestHandler<unknown, ApiResponse, LoginRequestBody, unknown> = async (
  req,
  res,
) => {
  try {
    const { email, password } = req.body;

    // --- 1. Input Validation ---
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json(createResponse(false, 'Email and password are required.', null));
    }

    // Check for empty strings or whitespace-only inputs
    if (email.trim() === '' || password.trim() === '') {
      return res.status(400).json(createResponse(false, 'Email and password are required.', null));
    }

    // Validate email format
    const processedEmail = email.trim().toLowerCase();
    if (isInvalidEmail(processedEmail)) {
      return res
        .status(400)
        .json(createResponse(false, 'Please provide a valid email address.', null));
    }

    // --- 2. Find User by Email ---
    const user = await prisma.user.findUnique({
      where: { email: processedEmail },
    });

    if (!user) {
      return res.status(401).json(createResponse(false, 'Invalid email or password.', null));
    }

    // --- 3. Verify Password ---
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(createResponse(false, 'Invalid email or password.', null));
    }

    // --- 4. Generate JWT Token ---
    const token = generateToken({
      id: user.id,
      role: user.role,
    });

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
      createResponse(true, 'Login successful.', {
        user: userForResponse,
        token: token,
      }),
    );
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
