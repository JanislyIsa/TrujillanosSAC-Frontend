import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/icon';

/** Empleado con sesión pero sin permiso (por su cargo) para el módulo pedido. Se ve dentro de la intranet. */
@Component({
  selector: 'app-sin-acceso',
  imports: [RouterLink, Icon],
  template: `<section class="empty-state">
    <app-icon name="shield" />
    <h1>Acceso restringido</h1>
    <p>Tu cargo no tiene permiso para abrir esta sección.</p>
    <a class="button primary" routerLink="/intranet">Volver al inicio</a>
  </section>`,
})
export class SinAcceso {}
