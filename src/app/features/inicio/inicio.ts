import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { Icon } from '../../shared/icon';

/** Inicio de la intranet (/intranet): accesos a los módulos que el cargo del empleado permite. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Icon],
  template: `<header class="page-heading">
      <div>
        <h1>Hola, {{ auth.primerNombre() }}</h1>
        <p>
          {{ auth.sesion()?.cargo?.replaceAll('_', ' ') ?? 'Empleado' }} · elige con qué módulo
          quieres trabajar.
        </p>
      </div>
    </header>

    @if (!auth.accesoIntranet()) {
      <div class="notice warning" role="status">
        Tu cargo todavía no tiene módulos habilitados en la intranet.
      </div>
    }

    @if (auth.accesoIntranet()) {
      <section class="inicio__grupo">
        <h2>Inventario</h2>
        <div class="inicio__grid">
          @if (auth.puede('inventario')) {
            <a class="inicio__tarjeta" routerLink="/intranet/inventario/catalogo">
              <app-icon name="box" /><strong>Gestión de productos e insumos</strong>
              <span>Registra y edita productos, insumos y sus presentaciones.</span>
            </a>
          }
          <a class="inicio__tarjeta" routerLink="/intranet/inventario/stock">
            <app-icon name="stock" /><strong>Control de stock</strong>
            <span>Consulta existencias y niveles mínimos.</span>
          </a>
          @if (auth.puede('inventario')) {
            <a class="inicio__tarjeta" routerLink="/intranet/inventario/movimientos">
              <app-icon name="movement" /><strong>Movimientos de inventario</strong>
              <span>Entradas, salidas y ajustes de stock.</span>
            </a>
          }
          <a class="inicio__tarjeta" routerLink="/intranet/inventario/alertas">
            <app-icon name="alert" /><strong>Alertas</strong>
            <span>Faltantes y productos por vencer.</span>
          </a>
        </div>
      </section>
    }

    @if (auth.puede('compras')) {
      <section class="inicio__grupo">
        <h2>Compras</h2>
        <div class="inicio__grid">
          <a class="inicio__tarjeta" routerLink="/intranet/inventario/solicitudes">
            <app-icon name="file" /><strong>Solicitudes</strong>
            <span>Solicitudes de compra de insumos.</span>
          </a>
          <a class="inicio__tarjeta" routerLink="/intranet/compras/carrito">
            <app-icon name="cart" /><strong>Carrito de compra</strong>
            <span>Prepara las compras a proveedores.</span>
          </a>
          <a class="inicio__tarjeta" routerLink="/intranet/compras/cotizaciones">
            <app-icon name="movement" /><strong>Cotizaciones</strong>
            <span>Compara lo que cotizan los proveedores.</span>
          </a>
          <a class="inicio__tarjeta" routerLink="/intranet/compras/ordenes">
            <app-icon name="file" /><strong>Órdenes de compra</strong>
            <span>Seguimiento de las órdenes emitidas.</span>
          </a>
        </div>
      </section>
    }`,
  styles: `
    .inicio__grupo {
      margin-bottom: 26px;
    }
    .inicio__grupo h2 {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6a7280;
      margin: 0 0 12px;
    }
    .inicio__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 14px;
    }
    .inicio__tarjeta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px;
      background: #fff;
      border: 1px solid #d7dce4;
      border-radius: 11px;
      color: #20252b;
      text-decoration: none;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    .inicio__tarjeta:hover,
    .inicio__tarjeta:focus-visible {
      border-color: #0754c5;
      box-shadow: 0 4px 14px rgba(7, 84, 197, 0.12);
    }
    .inicio__tarjeta app-icon {
      width: 26px;
      height: 26px;
      color: #0754c5;
      margin-bottom: 4px;
    }
    .inicio__tarjeta strong {
      font-size: 14px;
    }
    .inicio__tarjeta span {
      font-size: 12.5px;
      line-height: 1.5;
      color: #6a7280;
    }
  `,
})
export class Inicio {
  readonly auth = inject(AuthService);
}
