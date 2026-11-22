import { Component, effect, inject, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { ComprasApi } from '../compras/compras-api';
import { Icon } from '../../shared/icon';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  // Usa los estilos de la intranet (botones, tablas, tarjetas); se cargan solo mientras se está en el portal.
  styleUrl: '../../../styles.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="supplier-shell">
      <aside class="supplier-sidebar">
        <a class="supplier-brand" routerLink="/proveedor/solicitudes"><strong>El Trujillano</strong><small>PORTAL DE PROVEEDORES</small></a>
        <nav aria-label="Navegación de proveedor">
          <a routerLink="/proveedor/solicitudes" routerLinkActive="active"><app-icon name="file"/>Solicitudes</a>
          <a routerLink="/proveedor/cotizaciones" routerLinkActive="active"><app-icon name="receipt"/>Cotizaciones</a>
        </nav>
        <div class="supplier-profile"><span class="avatar">{{compras.nombreUsuario().charAt(0).toUpperCase()}}</span><div><strong>{{compras.nombreUsuario()}}</strong><small>Proveedor</small></div><button title="Cerrar sesión" aria-label="Cerrar sesión" (click)="salir()"><app-icon name="logout"/></button></div>
      </aside>
      <main class="supplier-main"><header class="supplier-top"><span>COMPRAS DE INSUMOS</span><span class="supplier-status"><i></i> Conectado</span></header><section class="supplier-content"><router-outlet/></section></main>
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100dvh;color:#102044;font-family:Inter,'Segoe UI',sans-serif}.supplier-shell{min-height:100dvh;background:#f6f8fd}.supplier-sidebar{position:fixed;inset:0 auto 0 0;width:244px;background:#071535;color:#fff;display:flex;flex-direction:column;padding:26px 16px 20px;z-index:2}.supplier-brand{display:flex;flex-direction:column;padding:0 18px 34px;color:#fff;text-decoration:none}.supplier-brand strong{font-size:20px;letter-spacing:-.4px}.supplier-brand small{margin-top:6px;color:#9aaccb;font-size:10px;letter-spacing:1.4px}.supplier-sidebar nav{display:grid;gap:7px}.supplier-sidebar nav a{height:46px;display:flex;align-items:center;gap:13px;padding:0 14px;border-radius:6px;color:#c3cee5;text-decoration:none;font-size:14px}.supplier-sidebar nav a app-icon{width:18px;height:18px}.supplier-sidebar nav a.active{background:#a6b8fa;color:#10204b}.supplier-profile{margin-top:auto;border-top:1px solid #293856;padding:18px 5px 0;display:flex;align-items:center;gap:10px}.supplier-profile .avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#315ad2;font-weight:700}.supplier-profile div{display:grid;gap:3px;min-width:0}.supplier-profile strong{font-size:12px;overflow:hidden;text-overflow:ellipsis}.supplier-profile small{color:#9aaccb;font-size:10px}.supplier-profile button{margin-left:auto;border:0;background:transparent;color:#d8e1f3;cursor:pointer}.supplier-main{margin-left:244px;min-height:100dvh}.supplier-top{height:65px;border-bottom:1px solid #e0e5ef;background:#fbfcff;display:flex;align-items:center;justify-content:space-between;padding:0 34px;color:#59657b;font-size:12px;letter-spacing:.8px}.supplier-status{display:flex;align-items:center;gap:7px;color:#5c6880;letter-spacing:0}.supplier-status i{width:7px;height:7px;border-radius:50%;background:#20ad70}.supplier-content{max-width:1320px;margin:0 auto;padding:34px 38px}@media(max-width:760px){.supplier-sidebar{position:static;width:auto;padding:15px;min-height:unset}.supplier-brand{padding:0 6px 12px}.supplier-sidebar nav{grid-template-columns:1fr 1fr}.supplier-profile{display:none}.supplier-main{margin-left:0}.supplier-content{padding:22px 16px}.supplier-top{padding:0 18px}}
  `],
})
export class ProveedorLayout {
  readonly compras=inject(ComprasApi);
  private readonly auth=inject(AuthService);
  private readonly router=inject(Router);
  constructor(){
    // Si la sesión se cierra (Salir, o el token venció y el backend respondió 401), al login.
    effect(()=>{if(!this.auth.autenticado())void this.router.navigateByUrl('/login');});
  }
  salir(){this.auth.cerrarSesion();}
}
