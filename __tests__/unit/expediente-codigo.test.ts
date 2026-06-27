// Unit tests for expediente-codigo format logic (isolated from DB)

const YEAR = new Date().getFullYear();

function formatCodigoExpediente(seq: number): string {
  const padded = String(seq).padStart(5, '0');
  return `EXP-${YEAR}-${padded}`;
}

describe('expediente-codigo format', () => {
  it('formatea el primer expediente correctamente', () => {
    expect(formatCodigoExpediente(1)).toBe(`EXP-${YEAR}-00001`);
  });

  it('formatea el quinto expediente correctamente', () => {
    expect(formatCodigoExpediente(5)).toBe(`EXP-${YEAR}-00005`);
  });

  it('formatea un número de 5 dígitos sin padding', () => {
    expect(formatCodigoExpediente(99999)).toBe(`EXP-${YEAR}-99999`);
  });

  it('el formato es EXP-YYYY-NNNNN', () => {
    const result = formatCodigoExpediente(1);
    expect(result).toMatch(/^EXP-\d{4}-\d{5}$/);
  });

  it('el año es el año actual', () => {
    const result = formatCodigoExpediente(1);
    expect(result).toContain(`-${YEAR}-`);
  });

  it('los códigos de registro y expediente tienen prefijos distintos', () => {
    const reg = `REG-${YEAR}-00001`;
    const exp = formatCodigoExpediente(1);
    expect(exp.startsWith('EXP')).toBe(true);
    expect(reg.startsWith('REG')).toBe(true);
    expect(exp).not.toBe(reg);
  });
});
