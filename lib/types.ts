import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  role: 'administrado' | 'funcionario';
  createdAt: Date;
}

export interface MagicToken {
  _id: ObjectId;
  email: string;
  token: string;
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface Adjunto {
  nombre: string;
  s3Key: string;
  mimeType: string;
  tamaño: number;
}

export interface Registro {
  _id: ObjectId;
  numero: string;
  fechaEntrada: Date;
  userId: ObjectId;
  nombreSolicitante: string;
  direccionFiscal: string;
  nombreRepresentante?: string;
  expone: string;
  solicita: string;
  adjuntos: Adjunto[];
  estado: 'presentado' | 'en_tramite' | 'resuelto';
}

export interface Actuacion {
  _id: ObjectId;
  fecha: Date;
  texto: string;
  funcionarioId: ObjectId;
}

export interface Expediente {
  _id: ObjectId;
  codigo: string;
  fechaCreacion: Date;
  registroId: ObjectId;
  userId: ObjectId;
  tipoExpediente: string;
  funcionarioId: ObjectId;
  actuaciones: Actuacion[];
}

export interface ConfigSede {
  _id: ObjectId;
  slug: string;
  nombreAyuntamiento: string;
  logoUrl?: string;
  colorAccent: string;
  bienvenida: string;
  emailContacto: string;
  direccion: string;
  telefono: string;
}

// JWT payloads
export interface MagicTokenPayload {
  email: string;
  exp: number;
}

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: 'administrado' | 'funcionario';
}
