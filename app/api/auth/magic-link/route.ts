import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { signMagicToken } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/mail';
import { MagicToken } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email: string = body?.email?.trim()?.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email inválido' }, { status: 400 });
    }

    const token = signMagicToken(email);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const db = await getDb();
    const magicTokenDoc: Omit<MagicToken, '_id'> = {
      email,
      token,
      used: false,
      createdAt: now,
      expiresAt,
    };
    await db.collection<Omit<MagicToken, '_id'>>('magic_tokens').insertOne(magicTokenDoc);

    await sendMagicLinkEmail(email, token);

    return Response.json({ message: 'Magic link enviado' }, { status: 200 });
  } catch (error) {
    console.error('magic-link error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
