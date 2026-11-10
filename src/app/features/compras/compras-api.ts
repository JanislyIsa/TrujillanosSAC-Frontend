import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Cliente de los controladores REST de compras del backend. */
@Injectable({ providedIn: 'root' })
export class ComprasApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/compras';

  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.base + path, { withCredentials: true }));
  }
  post<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.base + path, body, { withCredentials: true }));
  }
  patch<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.base + path, body, { withCredentials: true }));
  }
}

export interface CotizacionResponse {
  id: number; fechaCotizacion: string; fechaEntrega: string; estado: string;
  solicitudId: number; proveedorId: number; proveedorNombre: string; monto: number;
  detalles: { id: number; insumoId: number; insumoNombre: string; unidadMedida: string; cantidad: number; precioUnitario: number; subtotal: number }[];
}

export interface CotizacionCompra {
  idCotizacion: number;
  codigo: string;
  solicitud: string;
  proveedor: string;
  fechaCotizacion: string;
  fechaEntrega: string;
  estado: string;
  monto: number;
  tieneOrden: boolean;
  detalles: { insumo: string; cantidad: number; unidad: string; precioUnitario: number; subtotal: number }[];
}

export interface OrdenCompraResponse {
  id: number; fechaEmision: string; descripcion: string; cotizacionId: number;
  proveedorNombre: string; total: number;
  detalles: { id: number; insumoId: number; insumoNombre: string; unidadMedida: string; cantidad: number; precioUnitario: number; subtotal: number }[];
}

export interface ComprobanteCompra { id: number; fechaEmision: string; monto: number; estado: string; ordenCompraId: number }
export interface PagoCompra { id: number; monto: number; fechaPago: string; comprobanteId: number; metodoPagoId: number; metodoPago: string }

export interface OrdenCompra {
  idOrden: number;
  codigoOrden: string;
  fechaEmision: string;
  proveedor: string;
  estado: string;
  total: number;
  descripcion: string;
  qrPagoUrl: string;
  pagada: boolean;
  comprobanteId: number | null;
  totalPagado: number;
  saldoPendiente: number;
  detalles: { insumo: string; cantidad: number; unidad: string; precioUnitario: number; subtotal: number }[];
}
