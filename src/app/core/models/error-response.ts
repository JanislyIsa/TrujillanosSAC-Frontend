/**
 * El backend responde errores con dos formatos según el módulo:
 * - auth y usuarios: { timestamp, status, error, message, path, validationErrors }
 * - ventas (ErrorResponse): { fechaHora, codigoEstado, error, mensaje, ruta }
 * Todos los campos son opcionales para poder leer cualquiera de los dos.
 */
export interface ErrorResponse {
  status?: number;
  codigoEstado?: number;
  error?: string;
  message?: string;
  mensaje?: string;
  validationErrors?: Record<string, string> | null;
}
