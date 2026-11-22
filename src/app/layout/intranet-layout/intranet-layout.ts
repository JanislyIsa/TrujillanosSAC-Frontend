import { Component, computed, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  readonly error = signal('');
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  /** Sección que se muestra en la ruta de migas, según la pantalla actual. */
  readonly seccion = computed(() => {
    const url = this.url();
    if (url.includes('/inventario')) return 'Inventario';
    if (url.includes('/compras')) return 'Compras';
    return 'Inicio';
  });

  constructor() {
    // Si la sesión se cierra (el backend respondió 401 porque el token venció, o se cerró desde otra
    // pestaña), al login volviendo a la pantalla actual.
    effect(() => {
      if (this.auth.autenticado()) return;
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    });
  }

  /** Sale de la intranet al catálogo; la sesión sigue abierta (se cierra desde "Mi cuenta"). */
  salir() {
    void this.router.navigateByUrl('/catalogo');
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }
}
