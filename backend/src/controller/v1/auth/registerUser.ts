import type { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import prisma from '@utils/prisma_connected';
import { createResponse, type ApiResponse } from '@utils/createResponse';

export interface RegisterRequestBody {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'CUSTOMER'; // Optional, defaults to CUSTOMER
}

// Password strength check (e.g., minimum 8 characters)
const isPasswordWeak = (password: string): boolean => {
  return password.length < 8;
};

// Email format check
const isInvalidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailRegex.test(email);
};

/**
 * Handles new user registration.
 * @route POST /v1/auth/register
 */
export const registerUser: RequestHandler<
  unknown,
  ApiResponse,
  RegisterRequestBody,
  unknown
> = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json(createResponse(false, 'Request body is required.', null));
    }

    const { name, email, password, role } = req.body;
    const validationErrors: { field: string; message: string }[] = [];

    // --- 1. Input Validation ---
    if (!name || typeof name !== 'string' || name.trim() === '') {
      validationErrors.push({ field: 'name', message: 'Name is required.' });
    }

    if (!email || typeof email !== 'string') {
      validationErrors.push({ field: 'email', message: 'Email is required.' });
    } else if (isInvalidEmail(email.trim())) {
      validationErrors.push({ field: 'email', message: 'Please provide a valid email address.' });
    }

    if (!password || typeof password !== 'string') {
      validationErrors.push({ field: 'password', message: 'Password is required.' });
    } else if (isPasswordWeak(password)) {
      validationErrors.push({
        field: 'password',
        message: 'Password is too weak. It must be at least 8 characters long.',
      });
    }

    // If there are any validation errors, return a 400 response
    if (validationErrors.length > 0) {
      // Find the primary error message to display
      const primaryError = validationErrors[0];
      const errorMessage = primaryError
        ? `Invalid input for ${primaryError.field}.`
        : 'Invalid input.';
      return res.status(400).json(createResponse(false, errorMessage, validationErrors));
    }

    // --- 2. Check for Duplicate User ---
    const processedEmail = email!.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: processedEmail },
    });

    if (existingUser) {
      return res
        .status(409)
        .json(createResponse(false, 'An account with this email already exists.', null));
    }

    // --- 3. Hash Password and Create User ---
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password!, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name: name!,
        email: processedEmail,
        password: hashedPassword,
        role: role || 'CUSTOMER', // Default to CUSTOMER if role is not provided
      },
    });

    // --- 4. Send Success Response ---
    // IMPORTANT: Never send the password back to the client.
    const userForResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at,
    };

    return res
      .status(201)
      .json(createResponse(true, 'User registered successfully.', userForResponse));
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json(createResponse(false, 'An unexpected error occurred.', null));
  }
};
