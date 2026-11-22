import { Component, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { Icon } from '../../shared/icon';

/**
 * Marco de la intranet (barra lateral + cabecera) para los empleados.
 *
 * Los estilos globales de la intranet están en src/styles.css y se cargan aquí con ViewEncapsulation.None:
 * Angular los agrega al entrar a la intranet y los quita al salir, así no chocan con los de la tienda.
 */
@Component({
  selector: 'app-intranet-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  templateUrl: './intranet-layout.html',
  styleUrls: ['../../../styles.css', '../../features/compras/compras.css'],
  encapsulation: ViewEncapsulation.None,
})
export class IntranetLayout {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly menuAbierto = signal(false);
  readonly saliendo = signal(false);
  readonly error = signal('');

  constructor() {
    // Si la sesión se cierra (botón Salir, o el backend respondió 401 porque el token venció), al login.
    // En un vencimiento se vuelve a la pantalla actual; al salir a propósito, no.
    effect(() => {
      if (this.auth.autenticado()) return;
      const volver = this.saliendo() ? undefined : { returnUrl: this.router.url };
      void this.router.navigate(['/login'], { queryParams: volver });
    });
  }

  salir() {
    if (this.saliendo()) return;
    this.saliendo.set(true);
    this.auth.cerrarSesion();
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }
}
