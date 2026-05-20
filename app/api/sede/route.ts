import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { ConfigSede } from '@/lib/types';

const DEFAULT_SEDE: Omit<ConfigSede, '_id'> = {
  slug: 'ayto-default',
  nombreAyuntamiento: 'Sede Electrónica Municipal',
  colorAccent: '#3B82F6',
  bienvenida: 'Bienvenido a la Sede Electrónica. Aquí puede realizar sus trámites de forma telemática.',
  emailContacto: 'sede@ayuntamiento.es',
  direccion: 'Plaza Mayor, 1',
  telefono: '900 000 000',
};

export async function GET() {
  try {
    const db = await getDb();
    const config = await db.collection<ConfigSede>('config_sede').findOne({});

    if (!config) {
      return Response.json(DEFAULT_SEDE);
    }

    return Response.json(config);
  } catch (error) {
    console.error('GET /api/sede error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { nombreAyuntamiento, colorAccent, bienvenida, emailContacto, direccion, telefono, slug } = body;

    if (!nombreAyuntamiento || !colorAccent || !bienvenida || !emailContacto || !direccion || !telefono) {
      return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const db = await getDb();
    const update: Partial<ConfigSede> = {
      slug: slug || 'ayto-default',
      nombreAyuntamiento,
      colorAccent,
      bienvenida,
      emailContacto,
      direccion,
      telefono,
    };

    await db.collection<ConfigSede>('config_sede').updateOne(
      {},
      { $set: update },
      { upsert: true }
    );

    const updated = await db.collection<ConfigSede>('config_sede').findOne({});
    return Response.json(updated);
  } catch (error) {
    console.error('PUT /api/sede error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
