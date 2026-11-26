import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensajeError } from '../../core/api';
import { AuthService } from '../../core/auth/auth-service';
import { Icon } from '../../shared/icon';
import { NumeroPipe } from '../../shared/format';

type TipoReporte = 'categorias' | 'productos' | 'movimientos' | 'proveedores';
interface VentaCategoria { categoriaId: number; categoriaNombre: string; unidadesVendidas: number; montoTotal: number; }
interface ProductoVendido { productoId: number; productoNombre: string; unidadesVendidas: number; montoTotal: number; }
interface Movimiento { idMovimiento: number; tipoMovimiento: string; fecha: string; hora: string; almacen: string; unidadesProductos: number; unidadesInsumos: number; totalUnidades: number; }
interface Proveedor { idProveedor: number; proveedor: string; cantidadOrdenes: number; montoTotal: number; }

@Component({ imports: [FormsModule, Icon, NumeroPipe], templateUrl: './reportes.html', styleUrl: './reportes.css' })
export class ReportesPage {
  readonly Number = Number;
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  readonly tipo = signal<TipoReporte>('categorias');
  readonly filas = signal<Array<VentaCategoria | ProductoVendido | Movimiento | Proveedor>>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly puedeCompras = computed(() => this.auth.puede('compras'));
  readonly titulo = computed(() => ({ categorias: 'Ventas por categoría', productos: 'Productos más vendidos', movimientos: 'Movimientos de inventario', proveedores: 'Compras por proveedor' })[this.tipo()]);
  readonly totalUnidades = computed(() => this.filas().reduce((s, f) => s + ('unidadesVendidas' in f ? Number(f.unidadesVendidas) : 'totalUnidades' in f ? Number(f.totalUnidades) : 0), 0));
  readonly totalMonto = computed(() => this.filas().reduce((s, f) => s + ('montoTotal' in f ? Number(f.montoTotal) : 0), 0));
  readonly totalOrdenes = computed(() => this.filas().reduce((s, f) => s + ('cantidadOrdenes' in f ? Number(f.cantidadOrdenes) : 0), 0));
  readonly maxBarra = computed(() => Math.max(1, ...this.filas().map(f => 'montoTotal' in f ? Number(f.montoTotal) : 0)));

  constructor() { void this.cargar(); }

  seleccionar(tipo: TipoReporte): void {
    if (tipo === 'proveedores' && !this.puedeCompras()) return;
    this.tipo.set(tipo);
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set('');
    try {
      const isFechaHora = this.tipo() === 'categorias' || this.tipo() === 'productos';
      let params = new HttpParams();
      if (this.desde()) params = params.set('desde', isFechaHora ? `${this.desde()}T00:00:00` : this.desde());
      if (this.hasta()) params = params.set('hasta', isFechaHora ? `${this.hasta()}T23:59:59` : this.hasta());
      let path: string;
      switch (this.tipo()) {
        case 'categorias': path = '/ventas/reportes/ventas-por-categoria'; break;
        case 'productos': path = '/ventas/reportes/productos-mas-vendidos'; params = params.set('top', '10'); break;
        case 'movimientos': path = '/reportes/inventario-movimientos'; break;
        case 'proveedores': path = '/reportes/compras-por-proveedor'; break;
      }
      const filas = await firstValueFrom(this.http.get<Array<VentaCategoria | ProductoVendido | Movimiento | Proveedor>>(`${environment.apiUrl}${path}`, { params }));
      this.filas.set(filas);
    } catch (e) { this.filas.set([]); this.error.set(mensajeError(e)); }
    finally { this.cargando.set(false); }
  }
}
