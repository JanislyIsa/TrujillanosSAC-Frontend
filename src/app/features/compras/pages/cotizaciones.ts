import {Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ComprasApi, CotizacionCompra, CotizacionResponse, PaginaCompras, CotizacionesResumen} from '../compras-api';
import {mensajeError} from '../../../core/api';
import {Icon} from '../../../shared/icon';
import {FechaPipe, NumeroPipe} from '../../../shared/format';
import {Dialog} from '../../../shared/dialog';
import {Pager} from '../../../shared/pager';

@Component({imports: [FormsModule, Icon, FechaPipe, NumeroPipe, Dialog, Pager], templateUrl: './cotizaciones.html'})
export class CotizacionesPage {
    private readonly api = inject(ComprasApi);
    readonly data = signal<CotizacionCompra[]>([]);
    readonly loading = signal(true);
    readonly busyId = signal<number | null>(null);
    readonly error = signal('');
    readonly success = signal('');
    readonly buscar = signal('');
    readonly detalle = signal<CotizacionCompra | null>(null);
    readonly ordenGenerada = signal<CotizacionCompra | null>(null);
    readonly accionPendiente = signal<{
        cotizacion: CotizacionCompra;
        accion: 'generar-orden' | 'rechazar'
    } | null>(null);
    readonly pagina = signal(0);
    readonly tamanio = 10;
    readonly totalRegistros = signal(0);
    readonly paginas = signal(0);
    readonly pendientes = signal(0);
    readonly procesadas = signal(0);
    private secuencia = 0;
    private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

    constructor() {
        void this.cargar();
    }

    cambiarBusqueda(valor: string) {
        this.buscar.set(valor);
        if (this.temporizadorBusqueda) clearTimeout(this.temporizadorBusqueda);
        this.temporizadorBusqueda = setTimeout(() => void this.cargar(0), 300);
    }

    async cargar(pagina = this.pagina()) {
        const secuencia = ++this.secuencia;
        this.pagina.set(pagina);
        this.loading.set(true);
        this.error.set('');
        try {
            const [resultado, resumen] = await Promise.all([
                this.api.get<PaginaCompras<CotizacionResponse>>('/cotizaciones', {
                    pagina, tamanio: this.tamanio, buscar: this.buscar(),
                }),
                this.api.get<CotizacionesResumen>('/cotizaciones/resumen')
            ]);
            if (secuencia !== this.secuencia) return;
            this.totalRegistros.set(resultado.totalElementos);
            this.paginas.set(resultado.totalPaginas);
            this.pendientes.set(resumen.pendientes);
            this.procesadas.set(resumen.total - resumen.pendientes);
            this.data.set(resultado.contenido.map(c => ({
                idCotizacion: c.id, codigo: `CO_${String(c.id).padStart(2, '0')}`,
                solicitud: `SC_${String(c.solicitudId).padStart(2, '0')}`, proveedor: c.proveedorNombre,
                fechaCotizacion: c.fechaCotizacion, fechaEntrega: c.fechaEntrega, estado: c.estado,
                monto: c.monto, tieneOrden: c.tieneOrden,
                detalles: c.detalles.map(d => ({
                    insumo: d.insumoNombre,
                    cantidad: d.cantidad,
                    unidad: d.unidadMedida,
                    precioUnitario: d.precioUnitario,
                    subtotal: d.subtotal
                }))
            })));
        } catch (e) {
            if (secuencia === this.secuencia) this.error.set(mensajeError(e));
        } finally {
            if (secuencia === this.secuencia) this.loading.set(false);
        }
    }

    async responder(c: CotizacionCompra, accion: 'generar-orden' | 'rechazar') {
        if (this.busyId() !== null) return;
        this.busyId.set(c.idCotizacion);
        this.error.set('');
        this.success.set('');
        try {
            if (accion === 'rechazar') await this.api.patch(`/cotizaciones/${c.idCotizacion}/rechazar`);
            else {
                if (c.estado.toLowerCase() !== 'aceptada') await this.api.patch(`/cotizaciones/${c.idCotizacion}/aceptar`);
                await this.api.post('/ordenes', {
                    cotizacionId: c.idCotizacion,
                    descripcion: `Orden generada desde ${c.codigo}`
                });
            }
            if (accion === 'generar-orden') this.ordenGenerada.set(c);
            else this.success.set(`Cotización ${c.codigo} rechazada.`);
            await this.cargar();
        } catch (e) {
            this.error.set(mensajeError(e));
            if (accion === 'generar-orden') await this.cargar();
        } finally {
            this.busyId.set(null);
        }
    }

    pedirConfirmacion(cotizacion: CotizacionCompra, accion: 'generar-orden' | 'rechazar') {
        this.accionPendiente.set({cotizacion, accion});
    }

    async confirmarAccion() {
        const pendiente = this.accionPendiente();
        if (!pendiente || this.busyId() !== null) return;
        this.accionPendiente.set(null);
        await this.responder(pendiente.cotizacion, pendiente.accion);
    }
}
