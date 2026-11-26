import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { AuthService } from './auth-service';

/** Rutas públicas: no llevan token (así un token vencido no estorba al ver el catálogo). */
const PUBLICAS = [
  '/auth/login',
  '/auth/olvide-clave',
  '/auth/restablecer-clave',
  '/ventas/productos',
];

/** Agrega «Authorization: Bearer <token>» y cierra la sesión si el backend responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token || PUBLICAS.some((ruta) => req.url.includes(ruta))) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    tap({
      error: (e: unknown) => {
        if (e instanceof HttpErrorResponse && e.status === 401) auth.cerrarSesion();
      },
    }),
  );
};
