import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth';
import { Icon } from '../../shared/icon';

@Component({
  imports: [RouterLink, Icon],
  template: `
    <section class="module-panel">
      <p class="eyebrow">GESTIÓN OPERATIVA</p>
      <h1>Panel de módulos</h1>
      <p>Bienvenido, <strong>{{ auth.sesion()?.nombre }}</strong>. Selecciona un módulo para continuar.</p>
    </section>
    <section class="dashboard-grid" aria-label="Módulos disponibles">
      @if (auth.sesion()?.inventario) {
        <a class="dashboard-card" routerLink="/stock">
          <span class="dashboard-card-icon"><app-icon name="stock" /></span>
          <h2>Inventario</h2>
          <p>Stock, almacenes y productos</p>
          <span class="dashboard-card-action">Abrir módulo <span aria-hidden="true">→</span></span>
        </a>
      }
      @if (auth.sesion()?.compras) {
        <a class="dashboard-card" routerLink="/solicitudes">
          <span class="dashboard-card-icon compras"><app-icon name="file" /></span>
          <h2>Compras</h2>
          <p>Solicitudes, proveedores y órdenes</p>
          <span class="dashboard-card-action">Abrir módulo <span aria-hidden="true">→</span></span>
        </a>
      }
    </section>
  `,
  styles: [`
    :host{display:block}.module-panel{width:100%;margin:34px 0 26px;padding:0;background:none;border:0;border-radius:0;box-shadow:none}.module-panel .eyebrow{font-size:11px;letter-spacing:1.8px;font-weight:700;color:#747b88;margin-bottom:10px}.module-panel h1{font-size:32px;line-height:1.25;letter-spacing:-1.1px}.module-panel p:last-child{margin-top:9px;color:#747b88;font-size:14px;line-height:1.6}.dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;max-width:1200px}.dashboard-card{display:flex;flex-direction:column;align-items:flex-start;padding:28px;background:#fff;border:1px solid #d7dce4;border-radius:8px;color:inherit;text-decoration:none;transition:border-color .15s,box-shadow .15s}.dashboard-card:hover{border-color:#0754c5;box-shadow:0 6px 20px #0c213b0a}.dashboard-card-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:8px;background:#edf3fd;color:#0754c5;margin-bottom:20px}.dashboard-card-icon app-icon{width:22px;height:22px}.dashboard-card-icon.compras{background:#fff4dc;color:#a46c07}.dashboard-card h2{font-size:20px;margin-bottom:9px}.dashboard-card p{font-size:14px;line-height:1.6;color:#747b88;margin-bottom:24px}.dashboard-card-action{margin-top:auto;color:#0754c5;font-size:13px;font-weight:650;display:flex;justify-content:space-between;gap:20px;width:100%}@media(max-width:760px){.module-panel{margin-top:26px}.module-panel h1{font-size:28px}}@media(max-width:520px){.dashboard-grid{grid-template-columns:1fr;gap:14px}.dashboard-card{padding:22px}}
  `],
})
export class DashboardPage {
  readonly auth = inject(AuthService);
}
