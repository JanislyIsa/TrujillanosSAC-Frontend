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
    template: `
    <header class="page-heading"><div><h1>Mis cotizaciones</h1><p>Consulta el estado de tus propuestas y envía la factura de las órdenes aprobadas.</p></div></header>
    @if(error()){<div class="notice error" role="alert">{{error()}}</div>}
    <div class="summary-grid"><div class="summary-card over"><div class="summary-icon"><app-icon name="file"/></div><div><strong>{{pendientes()|number:'2.0-0'}}</strong><p>Pendientes</p></div></div><div class="summary-card"><div class="summary-icon"><app-icon name="check"/></div><div><strong>{{aprobadas()|number:'2.0-0'}}</strong><p>Aprobadas</p></div></div><div class="summary-card"><div class="summary-icon"><app-icon name="refresh"/></div><div><strong class="resumen-fecha">{{actualizada()|date:'dd/MM/yyyy, HH:mm'}}</strong><p>Última actualización</p></div></div></div>
    <div class="toolbar"><label class="search-input"><span class="visually-hidden">Buscar orden o fecha</span><app-icon name="search"/><input type="search" placeholder="Buscar orden o fecha…" [ngModel]="buscar()" (ngModelChange)="cambiarBusqueda($event)"></label></div>
    @if(loading()){<div class="loading-row"><span class="spinner"></span>Cargando cotizaciones…</div>}@else{<div class="table-card"><div class="table-scroll"><table><thead><tr><th>ORDEN</th><th>FECHA DE ENVÍO</th><th>TOTAL COTIZADO</th><th>ESTADO</th><th class="col-acciones">ACCIONES</th></tr></thead><tbody>
      @for(c of data();track c.id){@let orden=ordenPorCotizacion(c.id);<tr><td class="code">SC_{{c.solicitudId.toString().padStart(2,'0')}}</td><td>{{c.fechaCotizacion|date:'dd/MM/yyyy'}}</td><td><strong>S/ {{c.monto|number:'1.2-2'}}</strong></td><td><span class="badge" [class.over]="c.estado!=='Aceptada'&&c.estado!=='Rechazada'" [class.low]="c.estado==='Rechazada'">{{c.estado}}</span></td><td><div class="actions"><button class="button secondary small" (click)="verDetalle(c,orden)">Ver</button>@if(orden&&!orden.factura){<button class="button primary small" (click)="abrirFactura(orden)"><app-icon name="upload"/>Subir factura</button>}@else if(orden?.factura){<span class="invoice-state">Factura {{orden!.factura!.estado}}</span>}</div></td></tr>}
      @empty{<tr><td colspan="5"><div class="empty-state"><app-icon name="file"/><h3>Aún no tienes cotizaciones</h3><p>Cuando envíes propuestas, podrás seguir aquí su estado.</p></div></td></tr>}
    </tbody></table></div><app-pager [total]="totalRegistros()" [page]="pagina()" [pages]="paginas()" [size]="tamanio" [busy]="loading()" (changed)="cargar($event)"/></div>}
    @if(detalleOrden();as d){<div class="backdrop" (click)="detalleOrden.set(null)"><section class="dialog detail order-detail" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" (click)="$event.stopPropagation()"><header><div><h2 id="order-detail-title">Orden de compra</h2><p>Compromiso de pago de los insumos solicitados</p></div><span class="order-number">OC_{{d.orden.id.toString().padStart(4,'0')}}</span></header><section class="order-summary"><h3><app-icon name="file"/> Resumen de la solicitud de compra</h3><div class="detail-row head"><span>INSUMO</span><span>CANTIDAD</span><span>PRECIO UNITARIO</span><span>SUBTOTAL</span></div>@for(linea of d.cotizacion.detalles;track linea.id){<div class="detail-row"><strong>{{linea.insumoNombre}}</strong><span>{{linea.cantidad}} {{linea.unidadMedida}}</span><span>S/ {{linea.precioUnitario|number:'1.2-2'}}</span><strong>S/ {{linea.subtotal|number:'1.2-2'}}</strong></div>}<div class="modal-total">Total de la orden <strong>S/ {{d.orden.total|number:'1.2-2'}}</strong></div></section><div class="order-metadata"><div><small>Proveedor</small><strong>{{d.cotizacion.proveedorNombre}}</strong></div><div><small>Fecha estimada de entrega</small><strong>{{d.cotizacion.fechaEntrega|date:'dd/MM/yyyy'}}</strong></div><div><small>Estado</small><span class="badge" [class.over]="d.orden.estado!=='Aceptada'&&d.orden.estado!=='Pagado'">{{d.orden.estado}}</span></div></div>@if(d.orden.factura){<p class="existing-invoice">Factura {{d.orden.factura.numero}} · {{d.orden.factura.estado}}</p>}<footer class="order-detail-footer"><span>Solicitud SC_{{d.cotizacion.solicitudId.toString().padStart(2,'0')}}</span><button class="button primary" (click)="detalleOrden.set(null)">Volver</button></footer></section></div>}
    @if(detalle();as c){<div class="backdrop" (click)="detalle.set(null)"><section class="dialog detail" role="dialog" aria-modal="true" (click)="$event.stopPropagation()"><header><h2>Detalle de cotización</h2><button (click)="detalle.set(null)" aria-label="Cerrar">×</button></header><p>Solicitud SC_{{c.solicitudId.toString().padStart(2,'0')}} · {{c.fechaCotizacion|date:'dd/MM/yyyy'}}</p><div class="detail-row head"><span>INSUMO</span><span>CANTIDAD</span><span>UNITARIO</span><span>SUBTOTAL</span></div>@for(d of c.detalles;track d.id){<div class="detail-row"><strong>{{d.insumoNombre}}</strong><span>{{d.cantidad}} {{d.unidadMedida}}</span><span>S/ {{d.precioUnitario|number:'1.2-2'}}</span><strong>S/ {{d.subtotal|number:'1.2-2'}}</strong></div>}<div class="modal-total">Total cotizado <strong>S/ {{c.monto|number:'1.2-2'}}</strong></div></section></div>}
    @if(factura();as o){<div class="backdrop" (click)="cerrarFactura()"><section class="dialog invoice-dialog" role="dialog" aria-modal="true" aria-labelledby="invoice-title" (click)="$event.stopPropagation()"><header><h2 id="invoice-title">Enviar factura</h2><button (click)="cerrarFactura()" aria-label="Cerrar">×</button></header><p class="order-note">Orden de compra SC_{{o.id.toString().padStart(2,'0')}} · Total: <strong>S/ {{o.total|number:'1.2-2'}}</strong></p><div class="fields"><label>Número de factura<input name="numero" [ngModel]="numero()" (ngModelChange)="numero.set($event)" maxlength="50" placeholder="FAC-001234" required></label><label>Fecha<input name="fecha" type="date" [ngModel]="fecha()" (ngModelChange)="fecha.set($event)" [max]="hoy" required></label><label class="full">Monto total<input name="monto" type="number" min="0" step="0.01" [ngModel]="monto()" (ngModelChange)="monto.set(+$event)" required></label></div><label class="file-label">Subir PDF de factura<input id="invoice-pdf" type="file" accept="application/pdf,.pdf" (change)="seleccionar($event)"><span class="dropzone" [class.selected]="!!archivo()" [class.dragging]="arrastrando()" (dragover)="arrastrar($event)" (dragleave)="terminarArrastre()" (drop)="soltar($event)"><app-icon [name]="archivo()?'check':'upload'"/><strong>{{archivo()?'Archivo listo: '+archivo()!.name:'Haz clic para subir o arrastra un archivo'}}</strong><small>Solo PDF · máximo 10 MB</small></span></label>@if(razonesFactura().length){<ul class="invoice-hints">@for(razon of razonesFactura();track razon){<li>{{razon}}</li>}</ul>}@if(errorFactura()){<div class="notice error">{{errorFactura()}}</div>}<footer><button class="button secondary" (click)="cerrarFactura()">Cancelar</button><button class="button primary" [disabled]="enviando()||!validaFactura()" (click)="enviarFactura()"><app-icon name="upload"/>{{enviando()?'Enviando…':'Enviar factura'}}</button></footer></section></div>}
    @if(exito();as orden){<div class="backdrop"><section class="success" role="dialog" aria-modal="true" aria-labelledby="invoice-success-title"><span class="check"><app-icon name="check"/></span><h2 id="invoice-success-title">La factura para la orden OC_{{orden.id.toString().padStart(4,'0')}} se envió correctamente</h2><button class="button primary" (click)="exito.set(null)">Aceptar</button></section></div>}
  `,
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
