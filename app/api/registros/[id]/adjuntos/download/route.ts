import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/s3';
import { Registro } from '@/lib/types';
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

    const { id } = await params;
    if (!ObjectId.isValid(id)) return Response.json({ error: 'ID inválido' }, { status: 400 });

    const key = request.nextUrl.searchParams.get('key');
    if (!key) return Response.json({ error: 'Falta el parámetro key' }, { status: 400 });

    const db = await getDb();
    const registro = await db.collection<Registro>('registros').findOne({ _id: new ObjectId(id) });
    if (!registro) return Response.json({ error: 'Registro no encontrado' }, { status: 404 });

    if (payload.role === 'administrado' && registro.userId.toString() !== payload.userId) {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const adjunto = registro.adjuntos.find((a) => a.s3Key === key);
    if (!adjunto) return Response.json({ error: 'Adjunto no encontrado' }, { status: 404 });

    const url = await getPresignedUrl(adjunto.s3Key);
    return Response.redirect(url, 302);
  } catch (error) {
    console.error('GET /api/registros/[id]/adjuntos/download error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
