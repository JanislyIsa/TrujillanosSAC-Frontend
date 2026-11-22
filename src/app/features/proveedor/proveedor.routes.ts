import { Routes } from '@angular/router';
import { ProveedorLayout } from './proveedor-layout';

/** Rutas bajo /proveedor (portal de proveedores de insumos). El acceso lo controla proveedorGuard. */
export const PROVEEDOR_ROUTES: Routes = [
  {
    path: '',
    component: ProveedorLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./inicio').then((m) => m.InicioProveedorPage),
        title: 'Inicio · El Trujillano',
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./solicitudes').then((m) => m.SolicitudesProveedorPage),
        title: 'Solicitudes disponibles · El Trujillano',
      },
      {
        path: 'solicitudes/:id/cotizar',
        loadComponent: () => import('./cotizar').then((m) => m.CotizarProveedorPage),
        title: 'Enviar cotización · El Trujillano',
      },
      {
        path: 'cotizaciones',
        loadComponent: () => import('./cotizaciones').then((m) => m.CotizacionesProveedorPage),
        title: 'Mis cotizaciones · El Trujillano',
      },
    ],
  },
];
