import { describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { urlImagen } from './imagen';

describe('urlImagen', () => {
  it('preserva URL completas y vistas previas locales', () => {
    expect(urlImagen('https://cdn.example.test/img.png')).toBe('https://cdn.example.test/img.png');
    expect(urlImagen('blob:preview-id')).toBe('blob:preview-id');
    expect(urlImagen('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('forma la ruta de imagen servida por el backend', () => {
    expect(urlImagen('/img/golosina.png')).toBe(`${environment.backendUrl}/img/golosina.png`);
    expect(urlImagen('uploads/factura.png')).toBe(`${environment.backendUrl}/uploads/factura.png`);
  });
});
