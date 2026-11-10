import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComprasApi, ComprobanteCompra, OrdenCompra, OrdenCompraResponse, PagoCompra } from '../compras-api';
import { mensajeError } from '../../../core/api';
import { Icon } from '../../../shared/icon';
import { FechaPipe, NumeroPipe } from '../../../shared/format';
import { Dialog } from '../../../shared/dialog';

@Component({ imports: [FormsModule, Icon, FechaPipe, NumeroPipe, Dialog], templateUrl: './ordenes.html' })
export class OrdenesPage {
  // IDs seeded in database/oracle/02_catalogos.sql (Efectivo=1, Yape=2).
  private readonly metodoPagoId: Record<string, number> = { Efectivo: 1, Yape: 2 };
  private readonly api = inject(ComprasApi);
  readonly data = signal<OrdenCompra[]>([]); readonly loading = signal(true); readonly busy = signal(false);
  readonly error = signal(''); readonly success = signal(''); readonly buscar = signal('');
  readonly detalle = signal<OrdenCompra|null>(null); readonly pago = signal<OrdenCompra|null>(null);
  readonly metodo = signal('Yape');
  readonly montoPago = signal(0);
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
          total:o.total, descripcion:o.descripcion, qrPagoUrl:'', pagada:saldoPendiente===0,
          comprobanteId:comprobante?.id ?? null, totalPagado, saldoPendiente,
          detalles:o.detalles.map(d=>({insumo:d.insumoNombre,cantidad:d.cantidad,unidad:d.unidadMedida,precioUnitario:d.precioUnitario,subtotal:d.subtotal}))
        };
      }));
    } catch(e) { this.error.set(mensajeError(e)); } finally { this.loading.set(false); }
  }
  abrirPago(orden: OrdenCompra) { this.error.set(''); this.metodo.set('Yape'); this.montoPago.set(orden.saldoPendiente); this.pago.set(orden); }
  async registrarPago() {
    const orden=this.pago(); if(!orden||this.busy())return;
    if(!orden.comprobanteId){this.error.set('Esta orden todavía no tiene un comprobante de compra emitido por el proveedor.');return;}
    const monto=Number(this.montoPago());
    if(!Number.isFinite(monto)||monto<=0||monto>orden.saldoPendiente){this.error.set('Ingresa un monto mayor que cero y que no supere el saldo pendiente.');return;}
    const metodoPagoId=this.metodoPagoId[this.metodo()];
    if(!window.confirm(`¿Registrar un pago de S/ ${monto.toFixed(2)} para ${orden.codigoOrden} mediante ${this.metodo()}?`))return;
    this.busy.set(true);this.error.set('');this.success.set('');
    try{await this.api.post('/pagos',{comprobanteId:orden.comprobanteId,monto,fechaPago:this.fechaHoy(),metodoPagoId});this.success.set(`Pago de S/ ${monto.toFixed(2)} registrado para ${orden.codigoOrden}.`);this.pago.set(null);await this.cargar();}
    catch(e){this.error.set(mensajeError(e));}finally{this.busy.set(false);}
  }
  private fechaHoy() { const hoy=new Date();return `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`; }
}
