
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'ud-news-secret-key-2024';

export interface JwtPayload extends jwt.JwtPayload {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Ensure required fields exist
    if (!decoded.id || !decoded.username || !decoded.role) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('JWT verification error:', err);
    return res.status(500).json({ error: 'Failed to authenticate token' });
  }
};

export const generateToken = (user: { id: number; username: string; role: UserRole }) => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    issuer: 'udon-news-api',
    audience: 'udon-news-client'
  });
};

// Role-based authorization middleware
export const authorizeRoles = (...requiredRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const hasRequiredRole = requiredRoles.some(role => role === userRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: userRole
      });
    }
    
    next();
  };
};

// Convenience methods for common role checks
export const isAdmin = authorizeRoles('admin');
export const isEditor = authorizeRoles('admin', 'editor');
export const isViewer = authorizeRoles('admin', 'editor', 'viewer');

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 1, resetTime: now + windowMs };
      requestCounts.set(clientId, clientData);
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
};

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Invalid input data',
        details: error 
      });
    }
  };
};

// Admin authentication middleware (ใช้สำหรับ protected routes)
export const authMiddleware = authenticateToken;
