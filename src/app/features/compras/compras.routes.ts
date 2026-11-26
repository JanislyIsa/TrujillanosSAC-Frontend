import {Routes} from '@angular/router';
import {moduloGuard} from '../../core/auth/auth-guard';

/**
 * Rutas bajo /intranet/compras (jefe de compras). La solicitud de compra (reposición) sigue en
 * /intranet/inventario/solicitudes porque nace del stock. El backend vuelve a validar el cargo.
 */
export const COMPRAS_ROUTES: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'carrito'},
    {
        path: 'carrito',
        canActivate: [moduloGuard],
        data: {modulos: ['compras']},
        loadComponent: () => import('./pages/carrito').then((m) => m.CarritoPage),
        title: 'Carrito de compra · El Trujillano',
    },
    {
        path: 'cotizaciones',
        canActivate: [moduloGuard],
        data: {modulos: ['compras']},
        loadComponent: () => import('./pages/cotizaciones').then((m) => m.CotizacionesPage),
        title: 'Cotizaciones · El Trujillano',
    },
    {
        path: 'ordenes',
        canActivate: [moduloGuard],
        data: {modulos: ['compras']},
        loadComponent: () => import('./pages/ordenes').then((m) => m.OrdenesPage),
        title: 'Órdenes de compra · El Trujillano',
    },
];
