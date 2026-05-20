import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { Expediente } from '@/lib/types';
import { ObjectId } from 'mongodb';

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

    if (payload.role !== 'funcionario') {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) return Response.json({ error: 'ID inválido' }, { status: 400 });

    const db = await getDb();
    const expediente = await db.collection<Expediente>('expedientes').findOne({
      _id: new ObjectId(id),
    });

    if (!expediente) return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });

    return Response.json(expediente);
  } catch (error) {
    console.error('GET /api/expedientes/[id] error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
