import { Routes } from '@angular/router';
import { moduloGuard } from '../../core/auth/auth-guard';

/**
 * Rutas bajo /intranet/inventario. El acceso depende del cargo del empleado (data.modulos):
 * inventario = almacenero y jefe de almacén; compras = jefe de compras. El backend lo vuelve a validar.
 */
export const INVENTARIO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'stock' },
  {
    path: 'catalogo',
    canActivate: [moduloGuard],
    data: { modulos: ['inventario'] },
    loadComponent: () => import('./pages/catalogo').then((m) => m.CatalogoPage),
    title: 'Productos e insumos · El Trujillano',
  },
  {
    path: 'stock',
    canActivate: [moduloGuard],
    data: { modulos: ['inventario', 'compras'] },
    loadComponent: () => import('./pages/stock').then((m) => m.StockPage),
    title: 'Control de stock · El Trujillano',
  },
  {
    path: 'movimientos',
    canActivate: [moduloGuard],
    data: { modulos: ['inventario'] },
    loadComponent: () => import('./pages/movimientos').then((m) => m.MovimientosPage),
    title: 'Movimientos · El Trujillano',
  },
  {
    path: 'alertas',
    canActivate: [moduloGuard],
    data: { modulos: ['inventario', 'compras'] },
    loadComponent: () => import('./pages/alertas').then((m) => m.AlertasPage),
    title: 'Alertas · El Trujillano',
  },
  {
    path: 'solicitudes',
    canActivate: [moduloGuard],
    data: { modulos: ['compras'] },
    loadComponent: () => import('./pages/solicitudes').then((m) => m.SolicitudesPage),
    title: 'Solicitudes de reposición · El Trujillano',
  },
];
