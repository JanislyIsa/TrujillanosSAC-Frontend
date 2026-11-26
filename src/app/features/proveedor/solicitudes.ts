import {Component, computed, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ComprasApi, SolicitudProveedor} from '../compras/compras-api';
import {mensajeError} from '../../core/api';
import {Icon} from '../../shared/icon';
import {Pager} from '../../shared/pager';

@Component({
    imports: [FormsModule, Icon, Pager],
    template: `
    <header class="page-heading"><div><h1>Solicitudes disponibles</h1><p>Revisa los requerimientos asignados y envía tu cotización.</p></div></header>
    <div class="toolbar"><label class="search-input"><span class="visually-hidden">Buscar solicitud</span><app-icon name="search"/><input type="search" placeholder="Buscar solicitud…" [ngModel]="buscar()" (ngModelChange)="cambiarBusqueda($event)"></label></div>
    @if(error()){<div class="notice error" role="alert">{{error()}}</div>}
    @if(loading()){<div class="loading-row"><span class="spinner"></span>Cargando solicitudes…</div>}@else{
      <div class="table-card"><div class="table-scroll"><table><thead><tr><th>NRO</th><th>FECHA REQUERIDA</th><th>TOTAL INSUMOS</th><th>ESTADO</th><th class="col-acciones">ACCIONES</th></tr></thead><tbody>
      @for(s of data();track s.id){<tr><td class="code">SC_{{s.id.toString().padStart(2,'0')}}</td><td>{{s.fecha}}</td><td>{{s.insumos.length}}</td><td><span class="badge over">{{s.estado}}</span></td><td><div class="actions"><button class="button secondary small" (click)="detalle.set(s)">Ver</button><button class="button primary small" (click)="cotizar(s)"><app-icon name="file"/>Enviar cotización</button></div></td></tr>}
      @empty{<tr><td colspan="5"><div class="empty-state"><app-icon name="file"/><h3>No hay solicitudes disponibles</h3><p>Las solicitudes asignadas por la empresa aparecerán aquí.</p><button class="button secondary" (click)="cargar()">Actualizar</button></div></td></tr>}
      </tbody></table></div><app-pager [total]="totalRegistros()" [page]="pagina()" [pages]="paginas()" [size]="tamanio" [busy]="loading()" (changed)="cargar($event)"/></div>
    }
    @if(detalle();as s){<div class="backdrop" (click)="detalle.set(null)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title" (click)="$event.stopPropagation()"><header><div><span class="eyebrow">SOLICITUD SC_{{s.id.toString().padStart(2,'0')}}</span><h2 id="detail-title">Insumos solicitados</h2></div><button class="icon-button" (click)="detalle.set(null)" aria-label="Cerrar">×</button></header><div class="detail-table"><div class="detail-row head"><span>INSUMO</span><span>CANTIDAD</span><span>UNIDAD</span></div>@for(i of s.insumos;track i.id){<div class="detail-row"><strong>{{i.nombre}}</strong><span>{{i.cantidad}}</span><span>{{i.unidad}}</span></div>}</div><footer><button class="button secondary" (click)="detalle.set(null)">Cerrar</button><button class="button primary" (click)="cotizar(s)">Enviar cotización</button></footer></section></div>}
  `,
})
export class SolicitudesProveedorPage {
    private readonly api = inject(ComprasApi);
    private readonly router = inject(Router);
    readonly data = signal<SolicitudProveedor[]>([]);
    readonly loading = signal(true);
    readonly error = signal('');
    readonly buscar = signal('');
    readonly detalle = signal<SolicitudProveedor | null>(null);
    readonly pagina = signal(0);
    readonly tamanio = 10;
    readonly totalRegistros = signal(0);
    readonly paginas = signal(0);
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
            const resultado = await this.api.solicitudesProveedor({
                pagina,
                tamanio: this.tamanio,
                buscar: this.buscar()
            });
            if (secuencia !== this.secuencia) return;
            this.data.set(resultado.contenido);
            this.totalRegistros.set(resultado.totalElementos);
            this.paginas.set(resultado.totalPaginas);
        } catch (e) {
            if (secuencia === this.secuencia) this.error.set(mensajeError(e));
        } finally {
            if (secuencia === this.secuencia) this.loading.set(false);
        }
    }

    cotizar(s: SolicitudProveedor) {
        void this.router.navigate(['/proveedor/solicitudes', s.id, 'cotizar']);
    }
}
