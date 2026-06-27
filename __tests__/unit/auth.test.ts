import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-for-unit-tests-32chars!!';

process.env.JWT_SECRET = TEST_SECRET;

// Import after setting env var
import {
  signMagicToken,
  signSessionToken,
  verifyMagicToken,
  verifySessionToken,
  extractTokenFromHeader,
} from '@/lib/auth';

describe('auth helpers', () => {
  describe('signMagicToken / verifyMagicToken', () => {
    it('genera un JWT válido con el email', () => {
      const token = signMagicToken('test@example.com');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('verifica correctamente y devuelve el email', () => {
      const token = signMagicToken('test@example.com');
      const payload = verifyMagicToken(token);
      expect(payload.email).toBe('test@example.com');
    });

    it('lanza error con token expirado', () => {
      const expired = jwt.sign({ email: 'a@b.com' }, TEST_SECRET, { expiresIn: '-1s' });
      expect(() => verifyMagicToken(expired)).toThrow();
    });

    it('lanza error con firma inválida', () => {
      const token = jwt.sign({ email: 'a@b.com' }, 'wrong-secret');
      expect(() => verifyMagicToken(token)).toThrow();
    });
  });

  describe('signSessionToken / verifySessionToken', () => {
    const payload = { userId: 'user123', email: 'user@example.com', role: 'administrado' as const };

    it('genera un JWT de sesión válido', () => {
      const token = signSessionToken(payload);
      expect(typeof token).toBe('string');
    });

    it('verifica y devuelve el payload completo', () => {
      const token = signSessionToken(payload);
      const decoded = verifySessionToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('lanza error con firma inválida', () => {
      const token = jwt.sign(payload, 'wrong-secret');
      expect(() => verifySessionToken(token)).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('extrae el token del header Bearer', () => {
      const token = 'eyJhbGciOiJIUzI1NiJ9.test.sig';
      expect(extractTokenFromHeader(`Bearer ${token}`)).toBe(token);
    });

    it('devuelve null si no hay header', () => {
      expect(extractTokenFromHeader(null)).toBeNull();
    });

    it('devuelve null si el header no empieza por Bearer', () => {
      expect(extractTokenFromHeader('Basic abc123')).toBeNull();
    });

    it('devuelve null con string vacío', () => {
      expect(extractTokenFromHeader('')).toBeNull();
    });
  });
});
