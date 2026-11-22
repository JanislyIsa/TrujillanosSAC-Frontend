import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/error-response';

/** Mensaje legible para mostrar al usuario, a partir de cualquiera de los formatos de error del backend. */
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
  }
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.message ?? cuerpo?.mensaje ?? `Error ${err.status}: ${err.statusText}`;
}
