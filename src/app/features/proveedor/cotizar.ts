import {Component, computed, inject, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ComprasApi, SolicitudProveedor} from '../compras/compras-api';
import {mensajeError} from '../../core/api';
import {Icon} from '../../shared/icon';

@Component({
    imports: [FormsModule, RouterLink, Icon, DecimalPipe],
    template: `
    <a class="volver" routerLink="/proveedor/solicitudes">‹ Volver a solicitudes</a>
    @if(error()){<div class="notice error" role="alert">{{error()}}</div>}
    @if(loading()){<div class="loading-row"><span class="spinner"></span>Cargando solicitud…</div>}@else if(solicitud();as s){
      <header class="page-heading"><div><h1>Enviar cotización</h1><p>Solicitud SC_{{s.id.toString().padStart(2,'0')}} · completa el precio de cada insumo solicitado.</p></div><span class="badge blue">{{s.insumos.length}} insumos</span></header>
      <section class="table-card card"><header>INSUMOS SOLICITADOS</header><div class="table-scroll"><table><thead><tr><th>DESCRIPCIÓN</th><th>CANT.</th><th>UM</th><th>UNITARIO (S/)</th><th>SUBTOTAL</th></tr></thead><tbody>@for(i of s.insumos;track i.id;let n=$index){<tr><td><strong>{{i.nombre}}</strong></td><td>{{i.cantidad}}</td><td>{{i.unidad}}</td><td><input class="price" type="number" min="0" step="0.01" [name]="'price'+n" [(ngModel)]="precios[n]" (ngModelChange)="recalcular()" required></td><td class="amount">S/ {{(precios[n]||0)*i.cantidad|number:'1.2-2'}}</td></tr>}</tbody></table></div><div class="total"><span>Total cotizado:</span><strong>S/ {{total()|number:'1.2-2'}}</strong></div></section>
      <section class="card form-card"><label>Descripción (opcional)<textarea rows="3" [(ngModel)]="descripcion" name="descripcion" placeholder="Escribe detalles adicionales sobre esta cotización…"></textarea></label><div class="fields"><label>Fecha de entrega<input type="date" name="fechaEntrega" [(ngModel)]="fechaEntrega" [min]="hoy" required></label></div></section>
      <div class="actions"><button class="button secondary" routerLink="/proveedor/solicitudes">Cancelar</button><button class="button primary" [disabled]="busy()||!valida()" (click)="enviar()"><app-icon name="upload"/>{{busy()?'Enviando…':'Enviar cotización'}}</button></div>
    }@else{<div class="empty-state"><h3>No se encontró la solicitud</h3><p>Puede que ya hayas enviado una cotización o que ya no esté disponible.</p><a class="button primary" routerLink="/proveedor/solicitudes">Volver a solicitudes</a></div>}
    @if(exito()){<div class="backdrop"><section class="success"><span class="check"><app-icon name="check"/></span><h2>Se envió correctamente</h2><button class="button primary" (click)="irCotizaciones()">Aceptar</button></section></div>}
  `,
})
export class CotizarProveedorPage {
    private readonly api = inject(ComprasApi);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    readonly solicitud = signal<SolicitudProveedor | null>(null);
    readonly loading = signal(true);
    readonly busy = signal(false);
    readonly error = signal('');
    readonly exito = signal(false);
    readonly total = signal(0);
    readonly precios: number[] = [];
    descripcion = '';
    fechaEntrega = '';
    readonly hoy = new Date().toISOString().slice(0, 10);
    readonly valida = computed(() => !!this.solicitud() && !!this.fechaEntrega && new Date(this.fechaEntrega + 'T00:00:00') >= new Date(this.hoy + 'T00:00:00') && this.precios.length === this.solicitud()!.insumos.length && this.precios.every(v => Number.isFinite(Number(v)) && Number(v) >= 0));

    constructor() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.fechaEntrega = this.sumarDias(7);
        void this.cargar(id);
    }

    async cargar(id: number) {
        try {
            const solicitud = await this.api.solicitudProveedor(id);
            this.solicitud.set(solicitud);
            this.precios.splice(0, this.precios.length, ...solicitud.insumos.map(() => 0));
        } catch (e) {
            this.error.set(mensajeError(e));
        } finally {
            this.loading.set(false);
        }
    }

    recalcular() {
        const s = this.solicitud();
        this.total.set(s ? s.insumos.reduce((sum, i, n) => sum + (Number(this.precios[n]) || 0) * i.cantidad, 0) : 0);
    }

    async enviar() {
        const s = this.solicitud();
        if (!s || !this.valida() || this.busy()) return;
        this.busy.set(true);
        this.error.set('');
        try {
            await this.api.enviarCotizacion(s.id, this.fechaEntrega, s.insumos.map((i, n) => ({
                insumoId: i.id,
                cantidad: i.cantidad,
                precioUnitario: Number(this.precios[n])
            })), this.descripcion.trim() || undefined);
            this.exito.set(true);
        } catch (e) {
            this.error.set(mensajeError(e));
        } finally {
            this.busy.set(false);
        }
    }

    irCotizaciones() {
        this.exito.set(false);
        void this.router.navigateByUrl('/proveedor/cotizaciones');
    }

    private sumarDias(n: number) {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
    }
}
