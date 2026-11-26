import {Component, computed, effect, inject, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter, map} from 'rxjs';
import {AuthService} from '../../core/auth/auth-service';
import {ComprasApi} from '../compras/compras-api';
import {Icon} from '../../shared/icon';

/**
 * Marco del portal de proveedores. Usa la misma estructura y estilos que la intranet
 * (barra lateral, cabecera, tablas, botones); `proveedor.css` solo agrega lo propio del portal.
 * Los estilos son globales mientras se está en el portal y se quitan al salir.
 */
@Component({
    imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
    styleUrls: ['../../../styles.css', './proveedor.css'],
    encapsulation: ViewEncapsulation.None,
    templateUrl: './proveedor-layout.html',
})
export class ProveedorLayout {
    readonly compras = inject(ComprasApi);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    readonly menuAbierto = signal(false);
    readonly inicial = computed(() => this.compras.nombreUsuario().charAt(0).toUpperCase());
    private readonly url = toSignal(
        this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            map(() => this.router.url),
        ),
        {initialValue: this.router.url},
    );
    /** Sección que se muestra en la ruta de migas, según la pantalla actual. */
    readonly seccion = computed(() => {
        const url = this.url();
        if (url.includes('/cotizaciones')) return 'Cotizaciones';
        if (url.includes('/solicitudes')) return 'Solicitudes';
        return 'Inicio';
    });

    constructor() {
        // Si la sesión se cierra (el token venció y el backend respondió 401, o se cerró en otra pestaña), al login.
        effect(() => {
            if (!this.auth.autenticado()) void this.router.navigateByUrl('/login');
        });
    }

    /** Sale del portal al catálogo; la sesión sigue abierta (se cierra desde "Mi cuenta"). */
    salir() {
        void this.router.navigateByUrl('/catalogo');
    }

    cerrarMenu() {
        this.menuAbierto.set(false);
    }
}
