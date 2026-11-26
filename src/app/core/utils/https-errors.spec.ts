import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { mensajeError } from './https-errors';

describe('mensajeError', () => {
  it('traduce problemas de conexión y permisos', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
    expect(mensajeError(new HttpErrorResponse({ status: 401, error: { message: 'Sesión vencida' } }))).toBe('Sesión vencida');
    expect(mensajeError(new HttpErrorResponse({ status: 403, error: { mensaje: 'Acceso denegado' } }))).toBe('Acceso denegado');
  });

  it('conserva el mensaje de API y sus validaciones', () => {
    const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request', error: { mensaje: 'Datos inválidos' } });
    expect(mensajeError(error)).toBe('Datos inválidos');
  });

  it('maneja errores comunes y valores inesperados', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))).toBe('Error 500: Server Error');
  });
});
