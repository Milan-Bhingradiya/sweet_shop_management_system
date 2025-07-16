import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { createResponse } from './createResponse';

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
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(createResponse(false, 'Access token is required.', null));
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded; // Add user info to request
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(createResponse(false, 'Token has expired.', null));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json(createResponse(false, 'Invalid token.', null));
    } else {
      return res.status(403).json(createResponse(false, 'Token verification failed.', null));
    }
  }
};

/**
 * Role-based Authorization Middleware
 */
export const requireRole = (roles: ('ADMIN' | 'CUSTOMER')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload;

    if (!user) {
      return res.status(401).json(createResponse(false, 'Authentication required.', null));
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json(createResponse(false, 'Insufficient permissions.', null));
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Customer or Admin middleware
 */
export const requireAuth = requireRole(['ADMIN', 'CUSTOMER']);
