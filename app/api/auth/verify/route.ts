import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyMagicToken, signSessionToken } from '@/lib/auth';
import { MagicToken, User } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return Response.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Verify JWT signature + expiry
    let payload: { email: string };
    try {
      payload = verifyMagicToken(token);
    } catch {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const db = await getDb();
    const magicTokenDoc = await db.collection<MagicToken>('magic_tokens').findOne({
      token,
      used: false,
    });

    if (!magicTokenDoc) {
      return Response.json({ error: 'Token ya usado o no encontrado' }, { status: 401 });
    }

    if (new Date() > magicTokenDoc.expiresAt) {
      return Response.json({ error: 'Token expirado' }, { status: 401 });
    }

    // Mark token as used
    await db.collection<MagicToken>('magic_tokens').updateOne(
      { _id: magicTokenDoc._id },
      { $set: { used: true } }
    );

    // Upsert user
    const usersCollection = db.collection<User>('users');
    let user = await usersCollection.findOne({ email: payload.email });

    if (!user) {
      const newUser: Omit<User, '_id'> = {
        email: payload.email,
        name: payload.email.split('@')[0],
        role: 'administrado',
        createdAt: new Date(),
      };
      const insertResult = await usersCollection.insertOne(
        newUser as User
      );
      user = { ...newUser, _id: insertResult.insertedId } as User;
    }

    const sessionToken = signSessionToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return Response.json({
      token: sessionToken,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('verify error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
