import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { createResponse } from '@utils/createResponse';

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
  id: number;
  role: 'ADMIN' | 'CUSTOMER';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: { id: number; role: 'ADMIN' | 'CUSTOMER' }): string => {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

/**
 * JWT Authentication Middleware
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json(createResponse(false, 'Authorization header is required.', null));
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json(createResponse(false, 'Bearer token is required.', null));
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    return res.status(401).json(createResponse(false, 'Token is required.', null));
  }

  try {
    const decoded = verifyToken(token.trim());
    (req as any).user = decoded; // Add user info to request
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(createResponse(false, 'Token has expired.', null));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json(createResponse(false, 'Invalid token.', null));
    } else {
      return res.status(401).json(createResponse(false, 'Token verification failed.', null));
    }
  }
};

/**
 * Admin-only middleware - Use the exact error message from tests
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as JwtPayload;

  if (!user) {
    return res.status(401).json(createResponse(false, 'Authentication required.', null));
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json(createResponse(false, 'Admin access required.', null));
  }

  next();
};
