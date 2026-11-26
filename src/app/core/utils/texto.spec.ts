import { describe, expect, it } from 'vitest';
import { coincide, normalizar } from './texto';

describe('normalizar y coincide', () => {
  it('quita tildes, convierte a minúsculas y recorta extremos', () => {
    expect(normalizar('  ÁRBOL   ')).toBe('arbol');
  });

  it('busca todas las palabras sin depender del orden ni del campo', () => {
    expect(coincide('azucar kg', 'Azúcar blanca', 'Bolsa 1 KG')).toBe(true);
    expect(coincide('azucar inexistente', 'Azúcar blanca')).toBe(false);
  });

  it('considera verdadera una búsqueda vacía', () => {
    expect(coincide('  ', 'cualquier valor')).toBe(true);
  });
});
