import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { Registro } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) return Response.json({ error: 'No autorizado' }, { status: 401 });

    let payload: ReturnType<typeof verifySessionToken>;
    try {
      payload = verifySessionToken(token);
    } catch {
      return Response.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (payload.role !== 'funcionario') {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) return Response.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const allowedEstados = ['presentado', 'en_tramite', 'resuelto'] as const;
    if (!body.estado || !allowedEstados.includes(body.estado)) {
      return Response.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .collection<Registro>('registros')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { estado: body.estado } },
        { returnDocument: 'after' }
      );

    if (!result) return Response.json({ error: 'Registro no encontrado' }, { status: 404 });

    return Response.json(result);
  } catch (error) {
    console.error('PATCH /api/registros/[id] error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) return Response.json({ error: 'No autorizado' }, { status: 401 });

    let payload: ReturnType<typeof verifySessionToken>;
    try {
      payload = verifySessionToken(token);
    } catch {
      return Response.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) return Response.json({ error: 'ID inválido' }, { status: 400 });

    const db = await getDb();
    const registro = await db.collection<Registro>('registros').findOne({ _id: new ObjectId(id) });

    if (!registro) return Response.json({ error: 'Registro no encontrado' }, { status: 404 });

    // administrado can only see their own
    if (
      payload.role === 'administrado' &&
      registro.userId.toString() !== payload.userId
    ) {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return Response.json(registro);
  } catch (error) {
    console.error('GET /api/registros/[id] error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
