import { NextRequest } from 'next/server';
import { extractTokenFromHeader, verifySessionToken } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { Adjunto } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) return Response.json({ error: 'No autorizado' }, { status: 401 });

    try {
      verifySessionToken(token);
    } catch {
      return Response.json({ error: 'Token inválido' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return Response.json({ error: 'No se proporcionó archivo' }, { status: 400 });

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json({ error: 'Archivo demasiado grande (máx. 10MB)' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'bin';
    const s3Key = `adjuntos/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadFile(s3Key, buffer, file.type);

    const adjunto: Adjunto = {
      nombre: file.name,
      s3Key,
      mimeType: file.type,
      tamaño: file.size,
    };

    return Response.json(adjunto, { status: 201 });
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return Response.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
