import jwt from 'jsonwebtoken';
import { MagicTokenPayload, SessionTokenPayload } from './types';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return secret;
}

export function signMagicToken(email: string): string {
  return jwt.sign({ email } as MagicTokenPayload, getSecret(), { expiresIn: '15m' });
}

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyMagicToken(token: string): MagicTokenPayload {
  return jwt.verify(token, getSecret()) as MagicTokenPayload;
}

export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, getSecret()) as SessionTokenPayload;
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
