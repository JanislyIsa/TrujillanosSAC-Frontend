import { Routes } from '@angular/router';
import { Catalogo } from './pages/catalogo/catalogo';
import { autenticadoGuard } from '../../core/auth/auth-guard';
import { Carrito } from './pages/carrito/carrito';
import { PagoCompletado } from './pages/pago-completado/pago-completado';
import { PedidoDetalle } from './pages/pedido-detalle/pedido-detalle';
import { Pedidos } from './pages/pedidos/pedidos';
import { ProductoDetalle } from './pages/producto-detalle/producto-detalle';

export const VENTAS_ROUTES: Routes = [
  { path: 'catalogo', component: Catalogo, title: 'Catálogo · El Trujillano' },
  { path: 'producto/:id', component: ProductoDetalle, title: 'Golosina · El Trujillano' },
  { path: 'carrito', component: Carrito, title: 'Mi carrito · El Trujillano' },
  {
    path: 'pedidos',
    component: Pedidos,
    canActivate: [autenticadoGuard],
    title: 'Mis pedidos · El Trujillano',
  },
  {
    path: 'pedidos/:id',
    component: PedidoDetalle,
    canActivate: [autenticadoGuard],
    title: 'Pedido · El Trujillano',
  },
  {
    path: 'pedidos/:id/pago-completado',
    component: PagoCompletado,
    canActivate: [autenticadoGuard],
    title: 'Pago recibido · El Trujillano',
  },
];
