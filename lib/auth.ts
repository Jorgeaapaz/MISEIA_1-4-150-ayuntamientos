import jwt from 'jsonwebtoken';
import { MagicTokenPayload, SessionTokenPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

export function signMagicToken(email: string): string {
  return jwt.sign({ email } as MagicTokenPayload, JWT_SECRET, { expiresIn: '15m' });
}

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyMagicToken(token: string): MagicTokenPayload {
  return jwt.verify(token, JWT_SECRET) as MagicTokenPayload;
}

export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, JWT_SECRET) as SessionTokenPayload;
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
