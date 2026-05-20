import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { generateNumeroRegistro } from '@/lib/registro-numero';
import { Registro } from '@/lib/types';
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

    const db = await getDb();
    const query =
      payload.role === 'funcionario' ? {} : { userId: new ObjectId(payload.userId) };

    const registros = await db
      .collection<Registro>('registros')
      .find(query)
      .sort({ fechaEntrada: -1 })
      .toArray();

    return Response.json(registros);
  } catch (error) {
    console.error('GET /api/registros error:', error);
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

    if (payload.role !== 'administrado') {
      return Response.json({ error: 'Solo los administrados pueden presentar instancias' }, { status: 403 });
    }

    const body = await request.json();
    const { nombreSolicitante, direccionFiscal, nombreRepresentante, expone, solicita, adjuntos } = body;

    if (!nombreSolicitante || !direccionFiscal || !expone || !solicita) {
      return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const numero = await generateNumeroRegistro();

    const registro: Omit<Registro, '_id'> = {
      numero,
      fechaEntrada: new Date(),
      userId: new ObjectId(payload.userId),
      nombreSolicitante,
      direccionFiscal,
      nombreRepresentante: nombreRepresentante || undefined,
      expone,
      solicita,
      adjuntos: adjuntos || [],
      estado: 'presentado',
    };

    const db = await getDb();
    const result = await db.collection<Registro>('registros').insertOne(registro as Registro);

    return Response.json({ _id: result.insertedId, ...registro }, { status: 201 });
  } catch (error) {
    console.error('POST /api/registros error:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
