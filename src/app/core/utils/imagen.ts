import { environment } from '../../../environments/environment';

/**
 * URL completa de una imagen del backend. El backend entrega rutas relativas (/img/…, /uploads/…) que sirve
 * Spring, no Angular, así que se antepone backendUrl. Las URL absolutas (https://…) y las vistas previas locales (data:, blob:) se dejan igual.
 */
export function urlImagen(ruta: string): string {
  if (!ruta || /^(https?:|data:|blob:)/i.test(ruta)) return ruta;
  return `${environment.backendUrl}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
}
