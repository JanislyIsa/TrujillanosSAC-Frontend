import { Routes } from '@angular/router';
import { authGuard, permisoGuard } from './core/auth';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ComprasApi } from './features/compras/compras-api';
import { Layout } from './layout/layout';
const proveedorGuard=()=>inject(ComprasApi).esProveedor()||inject(Router).createUrlTree(['/login']);
export const routes:Routes=[
  {path:'proveedor',canActivate:[proveedorGuard],loadComponent:()=>import('./features/proveedor/proveedor-layout').then(m=>m.ProveedorLayout),children:[
    {path:'',pathMatch:'full',redirectTo:'solicitudes'},
    {path:'solicitudes',loadComponent:()=>import('./features/proveedor/solicitudes').then(m=>m.SolicitudesProveedorPage),title:'Solicitudes disponibles · El Trujillano'},
    {path:'solicitudes/:id/cotizar',loadComponent:()=>import('./features/proveedor/cotizar').then(m=>m.CotizarProveedorPage),title:'Enviar cotización · El Trujillano'},
    {path:'cotizaciones',loadComponent:()=>import('./features/proveedor/cotizaciones').then(m=>m.CotizacionesProveedorPage),title:'Mis cotizaciones · El Trujillano'},
  ]},
  {path:'sin-acceso',loadComponent:()=>import('./features/auth/sin-acceso').then(m=>m.SinAcceso)},
  {path:'login',loadComponent:()=>import('./features/auth/login').then(m=>m.Login),title:'Iniciar sesión · El Trujillano'},
  {path:'',component:Layout,canActivate:[authGuard],children:[
    {path:'',pathMatch:'full',redirectTo:'dashboard'},
    {path:'dashboard',loadComponent:()=>import('./features/dashboard/dashboard').then(m=>m.DashboardPage),title:'Panel de módulos · El Trujillano'},
    {path:'catalogo',canActivate:[permisoGuard],data:{permiso:'inventario'},loadComponent:()=>import('./features/inventario/pages/catalogo').then(m=>m.CatalogoPage),title:'Productos e insumos · El Trujillano'},
    {path:'stock',loadComponent:()=>import('./features/inventario/pages/stock').then(m=>m.StockPage),title:'Control de stock · El Trujillano'},
    {path:'movimientos',canActivate:[permisoGuard],data:{permiso:'inventario'},loadComponent:()=>import('./features/inventario/pages/movimientos').then(m=>m.MovimientosPage),title:'Movimientos · El Trujillano'},
    {path:'alertas',loadComponent:()=>import('./features/inventario/pages/alertas').then(m=>m.AlertasPage),title:'Alertas · El Trujillano'},
    {path:'solicitudes',canActivate:[permisoGuard],data:{permiso:'compras'},loadComponent:()=>import('./features/inventario/pages/solicitudes').then(m=>m.SolicitudesPage),title:'Solicitudes de compra · El Trujillano'},
    {path:'carrito',canActivate:[permisoGuard],data:{permiso:'compras'},loadComponent:()=>import('./features/compras/pages/carrito').then(m=>m.CarritoPage),title:'Carrito de compra · El Trujillano'},
    {path:'cotizaciones',canActivate:[permisoGuard],data:{permiso:'compras'},loadComponent:()=>import('./features/compras/pages/cotizaciones').then(m=>m.CotizacionesPage),title:'Cotizaciones · El Trujillano'},
    {path:'ordenes',canActivate:[permisoGuard],data:{permiso:'compras'},loadComponent:()=>import('./features/compras/pages/ordenes').then(m=>m.OrdenesPage),title:'Órdenes de compra · El Trujillano'},
  ]},
  {path:'**',redirectTo:'dashboard'},
];
