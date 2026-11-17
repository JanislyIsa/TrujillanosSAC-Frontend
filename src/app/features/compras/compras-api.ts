import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Cliente de los controladores REST de compras del backend. */
@Injectable({ providedIn: 'root' })
export class ComprasApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/compras';
  private readonly tokenKey = 'trujillanos.compras.jwt';
  private readonly usernameKey = `${this.tokenKey}.username`;
  private readonly rolesKey = `${this.tokenKey}.roles`;

  async iniciarSesion(username: string, password: string): Promise<ComprasLoginResponse> {
    const response = await firstValueFrom(this.http.post<ComprasLoginResponse>(
      '/api/v1/auth/login', { username, password }, { withCredentials: false },
    ));
    sessionStorage.setItem(this.tokenKey, response.token);
    sessionStorage.setItem(`${this.tokenKey}.expiresAt`, String(Date.now() + response.expiraEnSegundos * 1000));
    sessionStorage.setItem(this.usernameKey, response.username);
    sessionStorage.setItem(this.rolesKey, JSON.stringify(response.roles));
    return response;
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(`${this.tokenKey}.expiresAt`);
    sessionStorage.removeItem(this.usernameKey);
    sessionStorage.removeItem(this.rolesKey);
  }

  tieneSesion(): boolean {
    const token = sessionStorage.getItem(this.tokenKey);
    const expiresAt = Number(sessionStorage.getItem(`${this.tokenKey}.expiresAt`));
    if (token && Number.isFinite(expiresAt) && expiresAt > Date.now()) return true;
    this.cerrarSesion();
    return false;
  }

  esProveedor(): boolean {
    try { return this.tieneSesion() && (JSON.parse(sessionStorage.getItem(this.rolesKey) ?? '[]') as string[]).includes('PROVEEDOR'); }
    catch { return false; }
  }

  nombreUsuario(): string { return sessionStorage.getItem(this.usernameKey) ?? 'Proveedor'; }

  async solicitudesProveedor(): Promise<SolicitudProveedor[]> { return this.get('/proveedor/solicitudes'); }
  async ordenesProveedor(): Promise<OrdenProveedor[]> { return this.get('/proveedor/ordenes'); }
  async enviarCotizacion(solicitudId: number, fechaEntrega: string, detalles: { insumoId: number; cantidad: number; precioUnitario: number }[], descripcion?: string): Promise<CotizacionResponse> {
    return this.post('/cotizaciones', { solicitudId, fechaEntrega, detalles, descripcion });
  }
  async enviarFactura(data: { ordenCompraId: number; numeroFactura: string; fechaEmision: string; monto: number; archivo: File }): Promise<void> {
    const form = new FormData();
    form.append('ordenCompraId', String(data.ordenCompraId));
    form.append('numeroFactura', data.numeroFactura);
    form.append('fechaEmision', data.fechaEmision);
    form.append('monto', String(data.monto));
    form.append('archivo', data.archivo);
    await firstValueFrom(this.http.post(`${this.base}/comprobantes/factura`, form, this.options()));
  }

  private options() {
    const token = this.tieneSesion() ? sessionStorage.getItem(this.tokenKey) : null;
    return {
      withCredentials: false,
      headers: token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders(),
    };
  }

  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.base + path, this.options()));
  }
  post<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.base + path, body, this.options()));
  }
  patch<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.base + path, body, this.options()));
  }
}

export interface ComprasLoginResponse {
  token: string; tipo: 'Bearer'; expiraEnSegundos: number; username: string; roles: string[]; permisos: string[];
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
export interface SolicitudProveedor { id: number; fecha: string; estado: string; insumos: { id: number; nombre: string; cantidad: number; unidad: string }[] }
export interface OrdenProveedor { id: number; fecha: string; cotizacionId: number; total: number; estado: string; factura: { id: number; numero: string; fecha: string; monto: number; estado: string } | null }
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
