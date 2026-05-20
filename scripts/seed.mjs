/**
 * Seed de datos de prueba — Sede Electrónica
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Crea:
 *   - 1 ConfigSede
 *   - 2 Users (1 administrado, 1 funcionario)
 *   - 4 Registros (distintos estados)
 *   - 2 Expedientes con actuaciones
 *   - Counters para registro y expediente
 */

import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'sede_electronica';
const JWT_SECRET = process.env.JWT_SECRET || 'magik-link-dev-secret-2026';

const client = new MongoClient(MONGODB_URI);

async function seed() {
  await client.connect();
  const db = client.db(MONGODB_DB);

  console.log(`\n🌱  Conectado a MongoDB: ${MONGODB_DB}\n`);

  // ─── Limpiar colecciones ───────────────────────────────────────────────────
  const collections = ['users', 'registros', 'expedientes', 'config_sede', 'counters', 'magic_tokens'];
  for (const col of collections) {
    await db.collection(col).deleteMany({});
  }
  console.log('🗑   Colecciones limpiadas');

  // ─── ConfigSede ───────────────────────────────────────────────────────────
  const sedeId = new ObjectId();
  await db.collection('config_sede').insertOne({
    _id: sedeId,
    slug: 'ayto-demo',
    nombreAyuntamiento: 'Ayuntamiento de Demo',
    colorAccent: '#3B82F6',
    bienvenida: 'Bienvenido a la sede electrónica del Ayuntamiento de Demo. Realice sus trámites de forma telemática, segura y disponible las 24 horas.',
    emailContacto: 'sede@ayto-demo.es',
    direccion: 'Plaza Mayor, 1 — 28001 Madrid',
    telefono: '91 000 00 00',
  });
  console.log('🏛   ConfigSede creada  →  slug: ayto-demo');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminId = new ObjectId();
  const funcId  = new ObjectId();
  const admin2Id = new ObjectId();

  await db.collection('users').insertMany([
    {
      _id: adminId,
      email: 'maria@demo.es',
      name: 'María García López',
      role: 'administrado',
      createdAt: new Date('2026-01-10T09:00:00Z'),
    },
    {
      _id: admin2Id,
      email: 'carlos@demo.es',
      name: 'Carlos Martínez Ruiz',
      role: 'administrado',
      createdAt: new Date('2026-02-05T11:30:00Z'),
    },
    {
      _id: funcId,
      email: 'funcionario@ayto-demo.es',
      name: 'Ana Sánchez Pérez',
      role: 'funcionario',
      createdAt: new Date('2025-12-01T08:00:00Z'),
    },
  ]);
  console.log('👤  Usuarios creados:');
  console.log('    · administrado → maria@demo.es');
  console.log('    · administrado → carlos@demo.es');
  console.log('    · funcionario  → funcionario@ayto-demo.es');

  // ─── Counters ─────────────────────────────────────────────────────────────
  const year = 2026;
  await db.collection('counters').insertMany([
    { _id: `registro-${year}`,   seq: 4 },
    { _id: `expediente-${year}`, seq: 2 },
  ]);

  // ─── Registros ────────────────────────────────────────────────────────────
  const reg1Id = new ObjectId();
  const reg2Id = new ObjectId();
  const reg3Id = new ObjectId();
  const reg4Id = new ObjectId();

  await db.collection('registros').insertMany([
    {
      _id: reg1Id,
      numero: 'REG-2026-00001',
      fechaEntrada: new Date('2026-03-10T10:15:00Z'),
      userId: adminId,
      nombreSolicitante: 'María García López',
      direccionFiscal: 'Calle Mayor, 14, 3ºB — 28001 Madrid',
      expone: 'Que necesita obtener una licencia de obras menores para reforma del baño en su vivienda habitual, sita en la dirección arriba indicada.',
      solicita: 'La concesión de licencia de obras menores para reforma interior de cuarto de baño, sin afección a elementos estructurales ni fachada.',
      adjuntos: [],
      estado: 'en_tramite',
    },
    {
      _id: reg2Id,
      numero: 'REG-2026-00002',
      fechaEntrada: new Date('2026-03-22T16:40:00Z'),
      userId: adminId,
      nombreSolicitante: 'María García López',
      direccionFiscal: 'Calle Mayor, 14, 3ºB — 28001 Madrid',
      expone: 'Que ha recibido una notificación de recargo por pago fuera de plazo del Impuesto de Bienes Inmuebles del ejercicio 2025, considerando dicha notificación incorrecta al haber abonado el recibo dentro del período voluntario.',
      solicita: 'La anulación del recargo notificado y la devolución, en su caso, de las cantidades indebidamente cobradas.',
      adjuntos: [],
      estado: 'presentado',
    },
    {
      _id: reg3Id,
      numero: 'REG-2026-00003',
      fechaEntrada: new Date('2026-04-01T09:05:00Z'),
      userId: admin2Id,
      nombreSolicitante: 'Carlos Martínez Ruiz',
      direccionFiscal: 'Avenida de la Paz, 33, 1ºA — 28020 Madrid',
      nombreRepresentante: 'Laura Martínez Soto (hija)',
      expone: 'Que es titular de un local comercial en planta baja y desea instalar una terraza exterior con 6 mesas y 24 sillas en la acera adyacente durante los meses de verano.',
      solicita: 'La concesión de autorización de ocupación de vía pública con terraza de veladores para la temporada estival 2026 (del 1 de junio al 30 de septiembre).',
      adjuntos: [],
      estado: 'resuelto',
    },
    {
      _id: reg4Id,
      numero: 'REG-2026-00004',
      fechaEntrada: new Date('2026-04-18T11:20:00Z'),
      userId: admin2Id,
      nombreSolicitante: 'Carlos Martínez Ruiz',
      direccionFiscal: 'Avenida de la Paz, 33, 1ºA — 28020 Madrid',
      expone: 'Que tiene previsto organizar un acto cultural en la Plaza Mayor los días 10 y 11 de mayo de 2026, consistente en una exposición de arte contemporáneo al aire libre con aforo estimado de 200 personas.',
      solicita: 'La autorización para la celebración del evento cultural descrito, así como el uso temporal del espacio público durante los citados días.',
      adjuntos: [],
      estado: 'presentado',
    },
  ]);
  console.log('📄  Registros creados: REG-2026-00001 al REG-2026-00004');

  // ─── Expedientes ──────────────────────────────────────────────────────────
  const exp1Id = new ObjectId();
  const exp2Id = new ObjectId();

  const act1 = {
    _id: new ObjectId(),
    fecha: new Date('2026-03-11T09:30:00Z'),
    texto: 'Se recibe el expediente y se comprueba la documentación aportada. Se solicita al solicitante que aporte plano de planta de la vivienda y presupuesto detallado de las obras.',
    funcionarioId: funcId,
  };
  const act2 = {
    _id: new ObjectId(),
    fecha: new Date('2026-03-18T14:15:00Z'),
    texto: 'Se recibe documentación complementaria (plano y presupuesto). Documentación completa. Se remite a servicios técnicos para informe previo.',
    funcionarioId: funcId,
  };
  const act3 = {
    _id: new ObjectId(),
    fecha: new Date('2026-03-25T10:00:00Z'),
    texto: 'Se recibe informe técnico favorable. Pendiente de firma de resolución por el concejal delegado.',
    funcionarioId: funcId,
  };

  const act4 = {
    _id: new ObjectId(),
    fecha: new Date('2026-04-03T08:45:00Z'),
    texto: 'Inicio de expediente de autorización de terraza. Se verifica que el local dispone de licencia de actividad vigente y que la acera tiene ancho suficiente conforme a ordenanza municipal.',
    funcionarioId: funcId,
  };
  const act5 = {
    _id: new ObjectId(),
    fecha: new Date('2026-04-10T16:00:00Z'),
    texto: 'Resolución favorable de autorización de terraza de veladores para temporada estival 2026. Notificada al interesado. Expediente resuelto.',
    funcionarioId: funcId,
  };

  await db.collection('expedientes').insertMany([
    {
      _id: exp1Id,
      codigo: 'EXP-2026-00001',
      fechaCreacion: new Date('2026-03-11T09:00:00Z'),
      registroId: reg1Id,
      userId: adminId,
      tipoExpediente: 'Licencia de obras menores',
      funcionarioId: funcId,
      actuaciones: [act1, act2, act3],
    },
    {
      _id: exp2Id,
      codigo: 'EXP-2026-00002',
      fechaCreacion: new Date('2026-04-02T08:30:00Z'),
      registroId: reg3Id,
      userId: admin2Id,
      tipoExpediente: 'Autorización de terraza de veladores',
      funcionarioId: funcId,
      actuaciones: [act4, act5],
    },
  ]);
  console.log('📁  Expedientes creados: EXP-2026-00001 y EXP-2026-00002');

  // ─── JWT de sesión para acceso rápido ─────────────────────────────────────
  const tokenAdmin = jwt.sign(
    { userId: adminId.toString(), email: 'maria@demo.es', role: 'administrado' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const tokenFunc = jwt.sign(
    { userId: funcId.toString(), email: 'funcionario@ayto-demo.es', role: 'funcionario' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('\n✅  Seed completado.\n');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('  Tokens de sesión para pruebas rápidas (válidos 7 días):');
  console.log('\n  [administrado] maria@demo.es');
  console.log(`  ${tokenAdmin}`);
  console.log('\n  [funcionario] funcionario@ayto-demo.es');
  console.log(`  ${tokenFunc}`);
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('\n  Pega el token en localStorage:');
  console.log("  localStorage.setItem('sede_token', '<token>')\n");

  await client.close();
}

seed().catch((err) => {
  console.error('❌  Error en el seed:', err);
  client.close();
  process.exit(1);
});
