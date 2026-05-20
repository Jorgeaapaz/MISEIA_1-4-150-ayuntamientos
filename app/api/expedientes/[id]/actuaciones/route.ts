import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { Expediente, Actuacion } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function POST(
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
    const { texto } = body;

    if (!texto?.trim()) {
      return Response.json({ error: 'El texto de la actuación es obligatorio' }, { status: 400 });
    }

    const actuacion: Actuacion = {
      _id: new ObjectId(),
      fecha: new Date(),
      texto: texto.trim(),
      funcionarioId: new ObjectId(payload.userId),
    };

    const db = await getDb();
    const result = await db.collection<Expediente>('expedientes').updateOne(
      { _id: new ObjectId(id) },
      { $push: { actuaciones: actuacion } }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    return Response.json(actuacion, { status: 201 });
  } catch (error) {
    console.error('POST /api/expedientes/[id]/actuaciones error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
