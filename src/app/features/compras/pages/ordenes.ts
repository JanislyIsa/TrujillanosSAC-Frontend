import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComprasApi, OrdenCompra, OrdenCompraListadoResponse, OrdenesResumen } from '../compras-api';
import { mensajeError } from '../../../core/api';
import { Icon } from '../../../shared/icon';
import { FechaPipe, NumeroPipe } from '../../../shared/format';
import { Dialog } from '../../../shared/dialog';
import { Pager } from '../../../shared/pager';

@Component({ imports: [FormsModule, Icon, FechaPipe, NumeroPipe, Dialog, Pager], templateUrl: './ordenes.html' })
export class OrdenesPage {
  private readonly api = inject(ComprasApi);
  readonly data = signal<OrdenCompra[]>([]); readonly loading = signal(true); readonly busy = signal(false);
  readonly error = signal(''); readonly buscar = signal('');
  readonly detalle = signal<OrdenCompra|null>(null); readonly confirmarRecepcion = signal<OrdenCompra|null>(null);
  readonly completada = signal<OrdenCompra|null>(null); readonly enviandoPago = signal(false);
  readonly pagina = signal(0); readonly tamanio = 10; readonly totalRegistros = signal(0); readonly paginas = signal(0);
  readonly pendientes = signal(0); readonly totalPendiente = signal(0);
  private secuencia = 0; private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  constructor() { void this.cargar(); }
  cambiarBusqueda(valor: string) {
    this.buscar.set(valor);
    if (this.temporizadorBusqueda) clearTimeout(this.temporizadorBusqueda);
    this.temporizadorBusqueda = setTimeout(() => void this.cargar(0), 300);
  }
  async cargar(pagina = this.pagina()) {
    const secuencia = ++this.secuencia;
    this.pagina.set(pagina); this.loading.set(true); this.error.set('');
    try {
      const [resultado, resumen] = await Promise.all([
        this.api.get<import('../compras-api').PaginaCompras<OrdenCompraListadoResponse>>('/ordenes', {
          pagina, tamanio: this.tamanio, buscar: this.buscar(),
        }),
        this.api.get<OrdenesResumen>('/ordenes/resumen')
      ]);
      if (secuencia !== this.secuencia) return;
      this.totalRegistros.set(resultado.totalElementos); this.paginas.set(resultado.totalPaginas);
      this.pendientes.set(resumen.pendientes); this.totalPendiente.set(resumen.montoPendiente);
      this.data.set(resultado.contenido.map(o => {
        const saldoPendiente = o.saldoPendiente;
        return {
          idOrden:o.id, codigoOrden:`OR_${String(o.id).padStart(2,'0')}`, fechaEmision:o.fechaEmision,
          proveedor:o.proveedorNombre, estado: saldoPendiente === 0 ? 'Pagado' : o.comprobante ? 'Pendiente de pago' : 'Esperando comprobante',
          total:o.total, descripcion:o.descripcion, qrPagoUrl:'', pagada:saldoPendiente===0, comprobante: o.comprobante,
          comprobanteId:o.comprobante?.id ?? null, totalPagado:o.totalPagado, saldoPendiente,
          detalles:o.detalles.map(d=>({insumo:d.insumoNombre,cantidad:d.cantidad,unidad:d.unidadMedida,precioUnitario:d.precioUnitario,subtotal:d.subtotal}))
        };
      }));
    } catch(e) { if (secuencia === this.secuencia) this.error.set(mensajeError(e)); }
    finally { if (secuencia === this.secuencia) this.loading.set(false); }
  }
  async confirmarPagoEnEfectivo() {
    const orden = this.confirmarRecepcion();
    if (!orden?.comprobanteId || this.enviandoPago()) return;
    this.error.set(''); this.enviandoPago.set(true);
    try {
      const fechaPago = new Date();
      const fechaLocal = new Date(fechaPago.getTime() - fechaPago.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      await this.api.post('/pagos', {
        comprobanteId: orden.comprobanteId,
        monto: orden.saldoPendiente,
        fechaPago: fechaLocal,
      });
      this.confirmarRecepcion.set(null);
      await this.cargar();
      this.completada.set(orden);
    } catch (e) { this.error.set(mensajeError(e)); }
    finally { this.enviandoPago.set(false); }
  }
  async descargarFactura(orden: OrdenCompra) {
    if (!orden.comprobanteId) return;
    this.error.set('');
    try { await this.api.descargarFactura(orden.comprobanteId, orden.comprobante?.numeroFactura); }
    catch (e) { this.error.set(mensajeError(e)); }
  }
}
