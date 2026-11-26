import {Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ComprasApi, CotizacionResponse, OrdenProveedor, PaginaCompras} from '../compras/compras-api';
import {mensajeError} from '../../core/api';
import {Icon} from '../../shared/icon';
import {Pager} from '../../shared/pager';

function fechaLocalISO(fecha = new Date()): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return anio + '-' + mes + '-' + dia;
}

@Component({
    imports: [FormsModule, DatePipe, DecimalPipe, Icon, Pager],
    templateUrl: './cotizaciones.html',
})
export class CotizacionesProveedorPage {
    private readonly api = inject(ComprasApi);
    readonly data = signal<CotizacionResponse[]>([]);
    readonly ordenes = signal<OrdenProveedor[]>([]);
    readonly loading = signal(true);
    readonly error = signal('');
    readonly buscar = signal('');
    readonly detalle = signal<CotizacionResponse | null>(null);
    readonly detalleOrden = signal<{ cotizacion: CotizacionResponse; orden: OrdenProveedor } | null>(null);
    readonly factura = signal<OrdenProveedor | null>(null);
    readonly archivo = signal<File | null>(null);
    readonly errorFactura = signal('');
    readonly enviando = signal(false);
    readonly exito = signal<OrdenProveedor | null>(null);
    readonly actualizada = signal(new Date());
    readonly arrastrando = signal(false);
    readonly pagina = signal(0);
    readonly tamanio = 10;
    readonly totalRegistros = signal(0);
    readonly paginas = signal(0);
    readonly pendientes = signal(0);
    readonly aprobadas = signal(0);
    private secuencia = 0;
    private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
    readonly numero = signal('');
    readonly fecha = signal(fechaLocalISO());
    readonly monto = signal(0);
    readonly hoy = fechaLocalISO();
    readonly razonesFactura = computed(() => {
        const razones: string[] = [];
        const orden = this.factura();
        if (!orden) return razones;
        if (!this.numero().trim()) razones.push('Ingresa el número de factura.');
        if (!this.fecha()) razones.push('Indica la fecha de emisión.'); else if (this.fecha() > this.hoy) razones.push('La fecha de la factura no puede ser posterior a hoy.');
        if (!Number.isFinite(this.monto()) || this.monto() < 0 || this.monto() !== Number(orden.total)) razones.push('El monto debe coincidir con el total de la orden.');
        if (!this.archivo()) razones.push('Selecciona el archivo PDF de la factura.');
        return razones;
    });
    readonly validaFactura = computed(() => this.razonesFactura().length === 0);

    constructor() {
        void this.cargar();
    }

    ordenPorCotizacion(id: number) {
        return this.ordenes().find(o => o.cotizacionId === id);
    }

    verDetalle(c: CotizacionResponse, orden?: OrdenProveedor) {
        if (orden) this.detalleOrden.set({cotizacion: c, orden}); else this.detalle.set(c);
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
            const [resultado, resumen] = await Promise.all([this.api.get<PaginaCompras<CotizacionResponse>>('/cotizaciones/mias', {
                pagina,
                tamanio: this.tamanio,
                buscar: this.buscar()
            }), this.api.resumenCotizacionesProveedor()]);
            if (secuencia !== this.secuencia) return;
            const cotizaciones = resultado.contenido;
            const ordenes = cotizaciones.length ? await this.api.ordenesProveedor(cotizaciones.map(c => c.id)) : [];
            if (secuencia !== this.secuencia) return;
            this.data.set(cotizaciones);
            this.ordenes.set(ordenes);
            this.totalRegistros.set(resultado.totalElementos);
            this.paginas.set(resultado.totalPaginas);
            this.pendientes.set(resumen.pendientes);
            this.aprobadas.set(resumen.aprobadas);
            this.actualizada.set(new Date());
        } catch (e) {
            if (secuencia === this.secuencia) this.error.set(mensajeError(e));
        } finally {
            if (secuencia === this.secuencia) this.loading.set(false);
        }
    }

    abrirFactura(o: OrdenProveedor) {
        this.factura.set(o);
        this.numero.set('');
        this.fecha.set(this.hoy);
        this.monto.set(o.total);
        this.archivo.set(null);
        this.errorFactura.set('');
        this.arrastrando.set(false);
    }

    cerrarFactura() {
        if (!this.enviando()) this.factura.set(null);
    }

    seleccionar(event: Event) {
        const input = event.target as HTMLInputElement;
        this.seleccionarArchivo(input.files?.[0] ?? null);
        if (this.errorFactura()) input.value = '';
    }

    arrastrar(event: DragEvent) {
        event.preventDefault();
        this.arrastrando.set(true);
    }

    terminarArrastre() {
        this.arrastrando.set(false);
    }

    soltar(event: DragEvent) {
        event.preventDefault();
        this.arrastrando.set(false);
        this.seleccionarArchivo(event.dataTransfer?.files?.[0] ?? null);
    }

    private seleccionarArchivo(file: File | null) {
        this.errorFactura.set('');
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            this.errorFactura.set('Selecciona un archivo PDF.');
            this.archivo.set(null);
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            this.errorFactura.set('El archivo no puede superar 10 MB.');
            this.archivo.set(null);
            return;
        }
        this.archivo.set(file);
    }

    async enviarFactura() {
        const o = this.factura(), file = this.archivo();
        if (!o || !file || !this.validaFactura() || this.enviando()) return;
        this.enviando.set(true);
        this.errorFactura.set('');
        try {
            await this.api.enviarFactura({
                ordenCompraId: o.id,
                numeroFactura: this.numero().trim(),
                fechaEmision: this.fecha(),
                monto: this.monto(),
                archivo: file
            });
            this.factura.set(null);
            this.exito.set(o);
            await this.cargar();
        } catch (e) {
            this.errorFactura.set(mensajeError(e));
        } finally {
            this.enviando.set(false);
        }
    }
}
