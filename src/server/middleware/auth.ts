import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { loadDatabase } from '../db/store.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// In-memory rate limiting map for login attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export function rateLimitLogin(req: Request, res: Response, next: NextFunction): void {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 15;

  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (now - record.firstAttempt > windowMs) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (record.count >= maxAttempts) {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many login attempts from this network. Please wait 15 minutes before trying again.',
      },
    });
    return;
  }

  record.count += 1;
  next();
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required. No Bearer token provided.' },
    });
    return;
  }

  const user = resolveSessionUser(authHeader.substring(7));

  if (!user) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired session, or the account is no longer active.' },
    });
    return;
  }

  req.user = user;
  next();
}

// Verifies the token, then re-reads the account so deactivation, deletion, and role changes apply immediately
function resolveSessionUser(token: string): TokenPayload | null {
  const payload = verifyToken(token);
  if (!payload) return null;

  const account = loadDatabase().users.find((u) => u.id === payload.userId);
  if (!account || !account.isActive) return null;

  return {
    ...payload,
    username: account.username,
    role: account.role,
    fullName: account.fullName,
    doctorId: account.doctorId,
  };
}

// Attaches the staff user when a valid session is present; anonymous requests continue without one
export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const user = resolveSessionUser(authHeader.substring(7));
    if (user) req.user = user;
  }
  next();
}

export function authorize(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' },
      });
      return;
    }

    if (req.user.role === 'super_admin') {
      // Super admin can access everything
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Forbidden: Your role (${req.user.role}) does not have permission to perform this action.`,
        },
      });
      return;
    }

    next();
  };
}
