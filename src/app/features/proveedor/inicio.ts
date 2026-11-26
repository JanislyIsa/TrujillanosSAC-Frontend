import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ComprasApi} from '../compras/compras-api';
import {Icon} from '../../shared/icon';

/** Inicio del portal de proveedores (/proveedor): accesos a solicitudes y cotizaciones. */
@Component({
    imports: [RouterLink, Icon],
    template: `
    <header class="page-heading">
      <div>
        <h1>Hola, {{ nombre }}</h1>
        <p>Bienvenido al portal de proveedores de El Trujillano. ¿Qué quieres hacer hoy?</p>
      </div>
    </header>
    <div class="inicio__grid">
      <a class="inicio__tarjeta" routerLink="/proveedor/solicitudes">
        <app-icon name="file" /><strong>Solicitudes</strong>
        <span>Revisa las solicitudes de insumos y envía tu cotización.</span>
      </a>
      <a class="inicio__tarjeta" routerLink="/proveedor/cotizaciones">
        <app-icon name="movement" /><strong>Mis cotizaciones</strong>
        <span>Consulta el estado de tus propuestas y envía tus facturas.</span>
      </a>
    </div>
  `,
})
export class InicioProveedorPage {
    readonly nombre = inject(ComprasApi).nombreUsuario();
}
