import { Routes } from '@angular/router';
import { empleadoGuard, proveedorGuard, reportesGuard } from './core/auth/auth-guard';
import { IntranetLayout } from './layout/intranet-layout/intranet-layout';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  // Intranet de empleados (inventario y, más adelante, compras y ventas). Cada módulo cuelga de /intranet/<modulo>.
  {
    path: 'intranet',
    component: IntranetLayout,
    canActivate: [empleadoGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
        title: 'Inicio · El Trujillano',
      },
      {
        path: 'sin-acceso',
        loadComponent: () =>
          import('./features/auth/pages/sin-acceso/sin-acceso').then((m) => m.SinAcceso),
        title: 'Acceso restringido · El Trujillano',
      },
      {
        path: 'inventario',
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'compras',
        loadChildren: () =>
          import('./features/compras/compras.routes').then((m) => m.COMPRAS_ROUTES),
      },
      {
        path: 'reportes',
        canActivate: [reportesGuard],
        loadComponent: () => import('./features/reportes/reportes').then((m) => m.ReportesPage),
        title: 'Reportes · El Trujillano',
      },
    ],
  },
  // Portal de proveedores de insumos (solicitudes de compra y cotizaciones). Entra solo el rol PROVEEDOR.
  {
    path: 'proveedor',
    canActivate: [proveedorGuard],
    loadChildren: () =>
      import('./features/proveedor/proveedor.routes').then((m) => m.PROVEEDOR_ROUTES),
  },
  // Tienda de clientes (catálogo, carrito, pedidos) y login/registro/cuenta de todos.
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
      {
        path: '',
        loadChildren: () => import('./features/ventas/ventas.routes').then((m) => m.VENTAS_ROUTES),
      },
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'catalogo' },
];
