import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComprasApi, ComprobanteCompra, OrdenCompra, OrdenCompraResponse, PagoCompra } from '../compras-api';
import { mensajeError } from '../../../core/api';
import { Icon } from '../../../shared/icon';
import { FechaPipe, NumeroPipe } from '../../../shared/format';
import { Dialog } from '../../../shared/dialog';

@Component({ imports: [FormsModule, Icon, FechaPipe, NumeroPipe, Dialog], templateUrl: './ordenes.html' })
export class OrdenesPage {
  private readonly api = inject(ComprasApi);
  readonly data = signal<OrdenCompra[]>([]); readonly loading = signal(true); readonly busy = signal(false);
  readonly error = signal(''); readonly buscar = signal('');
  readonly detalle = signal<OrdenCompra|null>(null); readonly confirmarRecepcion = signal<OrdenCompra|null>(null);
  readonly completada = signal<OrdenCompra|null>(null); readonly enviandoPago = signal(false);
  readonly filtradas = computed(() => this.data().filter(o => (o.codigoOrden+' '+o.proveedor+' '+o.estado).toLowerCase().includes(this.buscar().trim().toLowerCase())));
  readonly pendientes = computed(() => this.data().filter(o => o.saldoPendiente > 0).length);
  readonly totalPendiente = computed(() => this.data().reduce((sum,o) => sum+o.saldoPendiente,0));
  constructor() { void this.cargar(); }
  async cargar() {
    this.loading.set(true); this.error.set('');
    try {
      const [ordenes, comprobantes, pagos] = await Promise.all([
        this.api.get<OrdenCompraResponse[]>('/ordenes'),
        this.api.get<ComprobanteCompra[]>('/comprobantes'),
        this.api.get<PagoCompra[]>('/pagos')
      ]);
      const comprobantePorOrden = new Map(comprobantes.map(c => [c.ordenCompraId, c]));
      const pagadoPorComprobante = new Map<number, number>();
      for (const pago of pagos) pagadoPorComprobante.set(pago.comprobanteId, (pagadoPorComprobante.get(pago.comprobanteId) ?? 0) + pago.monto);
      this.data.set(ordenes.map(o => {
        const comprobante = comprobantePorOrden.get(o.id);
        const totalPagado = comprobante ? (pagadoPorComprobante.get(comprobante.id) ?? 0) : 0;
        const saldoPendiente = Math.max(0, o.total-totalPagado);
        return {
          idOrden:o.id, codigoOrden:`OR_${String(o.id).padStart(2,'0')}`, fechaEmision:o.fechaEmision,
          proveedor:o.proveedorNombre, estado: saldoPendiente === 0 ? 'Pagado' : comprobante ? 'Pendiente de pago' : 'Esperando comprobante',
          total:o.total, descripcion:o.descripcion, qrPagoUrl:'', pagada:saldoPendiente===0, comprobante: comprobante ?? null,
          comprobanteId:comprobante?.id ?? null, totalPagado, saldoPendiente,
          detalles:o.detalles.map(d=>({insumo:d.insumoNombre,cantidad:d.cantidad,unidad:d.unidadMedida,precioUnitario:d.precioUnitario,subtotal:d.subtotal}))
        };
      }));
    } catch(e) { this.error.set(mensajeError(e)); } finally { this.loading.set(false); }
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
        metodoPagoId: 1,
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
