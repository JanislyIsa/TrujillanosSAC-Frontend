import { describe, expect, it } from 'vitest';
import { ESTADOS_PAGADOS, explicacionDe, tonoDe } from './estado-pedido';

describe('estado de pedido', () => {
  it('identifica estados que ya se cobraron', () => {
    expect(ESTADOS_PAGADOS).toContain('PAGADO');
    expect(ESTADOS_PAGADOS).not.toContain('PENDIENTE');
  });

  it('asigna tono a los estados principales', () => {
    expect(tonoDe('PENDIENTE')).toBe('aviso');
    expect(tonoDe('PROCESANDO_PAGO')).toBe('info');
    expect(tonoDe('CANCELADO')).toBe('error');
    expect(tonoDe('ENTREGADO')).toBe('exito');
  });

  it('explica los estados y devuelve vacío para uno desconocido', () => {
    expect(explicacionDe('PAGADO')).toContain('Recibimos tu pago');
    expect(explicacionDe('CANCELADO')).toContain('volvió al inventario');
    expect(explicacionDe('OTRO')).toBe('');
  });
});
