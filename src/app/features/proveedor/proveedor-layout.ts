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
    template: `
    <aside class="sidebar" [class.mobile-open]="menuAbierto()">
      <a class="brand" routerLink="/proveedor" (click)="cerrarMenu()"
        ><strong>El Trujillano</strong><span>PORTAL DE PROVEEDORES</span></a
      >
      <nav aria-label="Navegación del portal de proveedores">
        <div class="nav-section">
          <a class="nav-link" routerLink="/proveedor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="cerrarMenu()"><app-icon name="menu" /><span>Inicio</span></a>
        </div>
        <div class="nav-section">
          <span class="nav-heading">COMPRA DE INSUMOS</span>
          <a
            class="nav-link"
            routerLink="/proveedor/solicitudes"
            routerLinkActive="active"
            (click)="cerrarMenu()"
            ><app-icon name="file" /><span>Solicitudes</span></a
          >
          <a
            class="nav-link"
            routerLink="/proveedor/cotizaciones"
            routerLinkActive="active"
            (click)="cerrarMenu()"
            ><app-icon name="movement" /><span>Cotizaciones</span></a
          >
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="user-avatar">{{ inicial() }}</div>
        <div class="user-info">
          <strong>{{ compras.nombreUsuario() }}</strong
          ><small>Proveedor</small>
        </div>
      </div>
    </aside>
    @if (menuAbierto()) {
      <button class="menu-scrim" aria-label="Cerrar menú" (click)="cerrarMenu()"></button>
    }
    <div class="workspace portal">
      <header class="topbar">
        <div class="breadcrumb">
          <button
            class="icon-button menu-toggle"
            aria-label="Abrir menú"
            (click)="menuAbierto.set(!menuAbierto())"
          >
            <app-icon name="menu" /></button
          ><span>Portal de proveedores</span><app-icon name="chevron" /><span>{{ seccion() }}</span>
        </div>
        <button class="logout" title="Salir del portal y volver a la tienda" (click)="salir()">
          <app-icon name="logout" /><span>Salir</span>
        </button>
      </header>
      <main class="page-content"><router-outlet /></main>
    </div>
  `,
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
