// Unit tests for registro-numero format logic (isolated from DB)

const YEAR = new Date().getFullYear();

function formatNumeroRegistro(seq: number): string {
  const padded = String(seq).padStart(5, '0');
  return `REG-${YEAR}-${padded}`;
}

describe('registro-numero format', () => {
  it('formatea el primer registro correctamente', () => {
    expect(formatNumeroRegistro(1)).toBe(`REG-${YEAR}-00001`);
  });

  it('formatea el décimo registro correctamente', () => {
    expect(formatNumeroRegistro(10)).toBe(`REG-${YEAR}-00010`);
  });

  it('formatea un número de 5 dígitos sin padding', () => {
    expect(formatNumeroRegistro(99999)).toBe(`REG-${YEAR}-99999`);
  });

  it('el formato es REG-YYYY-NNNNN', () => {
    const result = formatNumeroRegistro(1);
    expect(result).toMatch(/^REG-\d{4}-\d{5}$/);
  });

  it('el año es el año actual', () => {
    const result = formatNumeroRegistro(1);
    expect(result).toContain(`-${YEAR}-`);
  });
});
