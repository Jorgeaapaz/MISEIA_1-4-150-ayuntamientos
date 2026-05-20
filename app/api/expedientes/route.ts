import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { generateCodigoExpediente } from '@/lib/expediente-codigo';
import { Expediente, Registro } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
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

    const db = await getDb();
    const expedientes = await db
      .collection<Expediente>('expedientes')
      .find({})
      .sort({ fechaCreacion: -1 })
      .toArray();

    return Response.json(expedientes);
  } catch (error) {
    console.error('GET /api/expedientes error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { registroId, tipoExpediente } = body;

    if (!registroId || !tipoExpediente) {
      return Response.json({ error: 'registroId y tipoExpediente son obligatorios' }, { status: 400 });
    }

    if (!ObjectId.isValid(registroId)) {
      return Response.json({ error: 'registroId inválido' }, { status: 400 });
    }

    const db = await getDb();
    const registro = await db.collection<Registro>('registros').findOne({
      _id: new ObjectId(registroId),
    });

    if (!registro) return Response.json({ error: 'Registro no encontrado' }, { status: 404 });

    const codigo = await generateCodigoExpediente();

    const expediente: Omit<Expediente, '_id'> = {
      codigo,
      fechaCreacion: new Date(),
      registroId: new ObjectId(registroId),
      userId: registro.userId,
      tipoExpediente,
      funcionarioId: new ObjectId(payload.userId),
      actuaciones: [],
    };

    const result = await db.collection<Expediente>('expedientes').insertOne(expediente as Expediente);

    // Update registro estado
    await db.collection<Registro>('registros').updateOne(
      { _id: new ObjectId(registroId) },
      { $set: { estado: 'en_tramite' } }
    );

    return Response.json({ _id: result.insertedId, ...expediente }, { status: 201 });
  } catch (error) {
    console.error('POST /api/expedientes error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
