import {Component, computed, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ComprasApi, SolicitudProveedor} from '../compras/compras-api';
import {mensajeError} from '../../core/api';
import {Icon} from '../../shared/icon';
import {Pager} from '../../shared/pager';

@Component({
    imports: [FormsModule, Icon, Pager],
    templateUrl: './solicitudes.html',
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
