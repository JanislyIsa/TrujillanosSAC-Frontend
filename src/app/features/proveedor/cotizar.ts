import {Component, computed, inject, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ComprasApi, SolicitudProveedor} from '../compras/compras-api';
import {mensajeError} from '../../core/api';
import {Icon} from '../../shared/icon';

@Component({
    imports: [FormsModule, RouterLink, Icon, DecimalPipe],
    templateUrl: './cotizar.html',
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
