import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getDb, saveDb } from './db.js';

export function hashPassword(password: string): string {
  // Using SHA256 with consistent salt
  return crypto.createHash('sha256').update(password + '_studyswap_salt').digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    college: string;
    branch: string;
    semester: string;
    avatar_color: string;
    bio: string;
    created_at: string;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT u.id, u.name, u.email, u.college, u.branch, u.semester, u.avatar_color, u.bio, u.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ?`,
      [token]
    );

    if (!result.length || !result[0].values.length) {
      return res.status(401).json({ error: 'Session expired or invalid token' });
    }

    const row = result[0].values[0];
    req.user = {
      id: row[0],
      name: row[1],
      email: row[2],
      college: row[3],
      branch: row[4],
      semester: row[5],
      avatar_color: row[6],
      bio: row[7],
      created_at: row[8]
    };

    next();
  } catch (err: any) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication server error' });
  }
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT u.id, u.name, u.email, u.college, u.branch, u.semester, u.avatar_color, u.bio, u.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ?`,
      [token]
    );

    if (result.length && result[0].values.length) {
      const row = result[0].values[0];
      req.user = {
        id: row[0],
        name: row[1],
        email: row[2],
        college: row[3],
        branch: row[4],
        semester: row[5],
        avatar_color: row[6],
        bio: row[7],
        created_at: row[8]
      };
    }
    next();
  } catch {
    next();
  }
}
