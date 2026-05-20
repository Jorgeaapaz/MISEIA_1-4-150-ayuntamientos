import { getDb } from './db';

export async function generateNumeroRegistro(): Promise<string> {
  const db = await getDb();
  const year = new Date().getFullYear();
  const counters = db.collection('counters');

  const result = await counters.findOneAndUpdate(
    { _id: `registro_${year}` as unknown as import('mongodb').ObjectId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const seq = result?.seq ?? 1;
  const padded = String(seq).padStart(5, '0');
  return `REG-${year}-${padded}`;
}
