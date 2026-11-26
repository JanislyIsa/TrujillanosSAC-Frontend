import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ModuloIntranet } from './auth-service';

/** Deja pasar solo con sesión; si no, lleva al login y vuelve a la pantalla pedida. */
export const autenticadoGuard: CanActivateFn = (_ruta, estado) => {
  if (inject(AuthService).autenticado()) return true;
  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: estado.url },
  });
};

/**
 * Intranet: solo empleados. Con la sesión de un cliente no se entra: se lleva al login (con un aviso) para
 * que ingrese con su usuario de empleado; al hacerlo, esa sesión reemplaza a la del cliente.
 */
export const empleadoGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: estado.url },
    });
  }
  return auth.esEmpleado()
    ? true
    : router.createUrlTree(['/login'], {
        queryParams: { returnUrl: estado.url, motivo: 'empleado' },
      });
};

/** Portal de proveedores (/proveedor): solo cuentas con rol PROVEEDOR. */
export const proveedorGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  if (!auth.autenticado()) {
    return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: estado.url } });
  }
  return auth.esProveedor() ? true : inject(Router).createUrlTree(['/catalogo']);
};

/**
 * Módulo de la intranet según el cargo. Se configura en la ruta: data: { modulos: ['inventario', 'compras'] }
 * deja pasar si el cargo da acceso a CUALQUIERA de los módulos listados.
 */
export const moduloGuard: CanActivateFn = (ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Sesión vencida mientras se usaba la intranet: al login, y vuelve a esta pantalla.
  if (!auth.autenticado()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: estado.url },
    });
  }
  const modulos = (ruta.data['modulos'] ?? []) as ModuloIntranet[];
  return modulos.some((m) => auth.puede(m)) || router.createUrlTree(['/intranet/sin-acceso']);
};

/** Solo cargos con al menos un reporte asignado pueden abrir el apartado de reportes. */
export const reportesGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const cargo = (auth.sesion()?.cargo ?? '').normalize('NFD').replace(/\p{M}/gu, '').trim().toUpperCase().replace(/\s+/g, '_');
  const ventas = ['JEFE_VENTAS', 'JEFE_DE_VENTAS'].includes(cargo);
  const administrador = ['ADMIN', 'ADMINISTRADOR'].includes(cargo);
  return ventas || administrador || auth.puede('inventario') || auth.puede('compras')
    ? true
    : inject(Router).createUrlTree(['/intranet/sin-acceso']);
};
