import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// ─── Extended Request type ────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  userId: string;
  email: string;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided. Authorization denied.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Malformed authorization header.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    (req as AuthRequest).userId = decoded.userId;
    (req as AuthRequest).email = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or has expired.' });
  }
};
