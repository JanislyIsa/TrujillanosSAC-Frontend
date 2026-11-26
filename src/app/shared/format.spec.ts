import { describe, expect, it } from 'vitest';
import { codigo, estadoLabel, FechaPipe, NumeroPipe } from './format';

describe('formatos compartidos', () => {
  it('genera códigos de producto e insumo con ceros a la izquierda', () => {
    expect(codigo({ tipoItem: 'PRODUCTO', id: 8 } as never)).toBe('PROD-008');
    expect(codigo({ tipoItem: 'INSUMO', id: 24 } as never)).toBe('INS-024');
  });

  it('traduce estados conocidos y conserva códigos desconocidos', () => {
    expect(estadoLabel('BAJO')).toBe('Stock bajo');
    expect(estadoLabel('OTRO')).toBe('OTRO');
  });

  it('formatea importes y valores ausentes', () => {
    expect(new NumeroPipe().transform(null)).toBe('—');
    expect(new NumeroPipe().transform(12.5)).toMatch(/12[.,]5/);
  });

  it('formatea fechas y valores ausentes', () => {
    const pipe = new FechaPipe();
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('2026-01-09')).toBe('09/01/2026');
  });
});
