import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComprasApi, CotizacionCompra, CotizacionResponse, OrdenCompraResponse } from '../compras-api';
import { mensajeError } from '../../../core/api';
import { Icon } from '../../../shared/icon';
import { FechaPipe, NumeroPipe } from '../../../shared/format';
import { Dialog } from '../../../shared/dialog';

@Component({ imports: [FormsModule, Icon, FechaPipe, NumeroPipe, Dialog], templateUrl: './cotizaciones.html' })
export class CotizacionesPage {
  private readonly api = inject(ComprasApi);
  readonly data = signal<CotizacionCompra[]>([]); readonly loading = signal(true); readonly busyId = signal<number|null>(null);
  readonly error = signal(''); readonly success = signal(''); readonly buscar = signal(''); readonly detalle = signal<CotizacionCompra|null>(null);
  readonly filtradas = computed(() => this.data().filter(c => (c.codigo+' '+c.solicitud+' '+c.proveedor+' '+c.estado).toLowerCase().includes(this.buscar().trim().toLowerCase())));
  readonly pendientes = computed(() => this.data().filter(c => !c.tieneOrden && c.estado.toLowerCase() !== 'rechazada').length);
  constructor() { void this.cargar(); }
  async cargar() {
    this.loading.set(true); this.error.set('');
    try {
      const [cotizaciones, ordenes] = await Promise.all([
        this.api.get<CotizacionResponse[]>('/cotizaciones'), this.api.get<OrdenCompraResponse[]>('/ordenes')
      ]);
      const cotizacionesConOrden = new Set(ordenes.map(o => o.cotizacionId));
      this.data.set(cotizaciones.map(c => ({
        idCotizacion: c.id, codigo: `CO_${String(c.id).padStart(2, '0')}`,
        solicitud: `SC_${String(c.solicitudId).padStart(2, '0')}`, proveedor: c.proveedorNombre,
        fechaCotizacion: c.fechaCotizacion, fechaEntrega: c.fechaEntrega, estado: c.estado,
        monto: c.monto, tieneOrden: cotizacionesConOrden.has(c.id),
        detalles: c.detalles.map(d => ({ insumo: d.insumoNombre, cantidad: d.cantidad, unidad: d.unidadMedida, precioUnitario: d.precioUnitario, subtotal: d.subtotal }))
      })));
    } catch(e) { this.error.set(mensajeError(e)); } finally { this.loading.set(false); }
  }
  async responder(c: CotizacionCompra, accion: 'generar-orden'|'rechazar') {
    if (this.busyId() !== null) return;
    const prompt = accion === 'generar-orden' ? `¿Generar una orden de compra por S/ ${c.monto.toFixed(2)} para ${c.proveedor}?` : `¿Rechazar la cotización ${c.codigo}?`;
    if (!window.confirm(prompt)) return;
    this.busyId.set(c.idCotizacion); this.error.set(''); this.success.set('');
    try {
      if (accion === 'rechazar') await this.api.patch(`/cotizaciones/${c.idCotizacion}/rechazar`);
      else {
        if (c.estado.toLowerCase() !== 'aceptada') await this.api.patch(`/cotizaciones/${c.idCotizacion}/aceptar`);
        await this.api.post('/ordenes', { cotizacionId: c.idCotizacion, descripcion: `Orden generada desde ${c.codigo}` });
      }
      this.success.set(accion === 'generar-orden' ? `Orden generada desde ${c.codigo}.` : `Cotización ${c.codigo} rechazada.`); await this.cargar();
    } catch(e) { this.error.set(mensajeError(e)); if (accion === 'generar-orden') await this.cargar(); } finally { this.busyId.set(null); }
  }
}
