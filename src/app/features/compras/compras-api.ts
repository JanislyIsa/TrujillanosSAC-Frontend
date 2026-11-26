import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {AuthService} from '../../core/auth/auth-service';

/**
 * Cliente de los controladores REST de compras del backend.
 * La sesión es la única del sistema (AuthService): el interceptor agrega «Authorization: Bearer» a cada
 * petición, así que aquí ya no se maneja ningún token propio.
 */
@Injectable({providedIn: 'root'})
export class ComprasApi {
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);
    private readonly base = `${environment.apiUrl}/compras`;

    esProveedor(): boolean {
        return this.auth.esProveedor();
    }

    nombreUsuario(): string {
        const sesion = this.auth.sesion();
        return sesion?.nombreCompleto || sesion?.username || 'Proveedor';
    }

    async solicitudesProveedor(query: Record<string, unknown> = {}): Promise<PaginaCompras<SolicitudProveedor>> {
        return this.get('/proveedor/solicitudes', query);
    }

    async solicitudProveedor(id: number): Promise<SolicitudProveedor> {
        return this.get(`/proveedor/solicitudes/${id}`);
    }

    async ordenesProveedor(cotizacionIds: number[] = []): Promise<OrdenProveedor[]> {
        return this.get('/proveedor/ordenes', cotizacionIds.length ? {cotizacionIds: cotizacionIds.join(',')} : {});
    }

    async resumenCotizacionesProveedor(): Promise<CotizacionesResumen> {
        return this.get('/cotizaciones/mias/resumen');
    }

    async enviarCotizacion(solicitudId: number, fechaEntrega: string, detalles: {
        insumoId: number;
        cantidad: number;
        precioUnitario: number
    }[], descripcion?: string): Promise<CotizacionResponse> {
        return this.post('/cotizaciones', {solicitudId, fechaEntrega, detalles, descripcion});
    }

    async enviarFactura(data: {
        ordenCompraId: number;
        numeroFactura: string;
        fechaEmision: string;
        monto: number;
        archivo: File
    }): Promise<void> {
        const form = new FormData();
        form.append('ordenCompraId', String(data.ordenCompraId));
        form.append('numeroFactura', data.numeroFactura);
        form.append('fechaEmision', data.fechaEmision);
        form.append('monto', String(data.monto));
        form.append('archivo', data.archivo);
        await firstValueFrom(this.http.post(`${this.base}/comprobantes/factura`, form, this.options()));
    }

    async descargarFactura(comprobanteId: number, numeroFactura?: string | null): Promise<void> {
        const archivo = await firstValueFrom(this.http.get(
            `${this.base}/comprobantes/${comprobanteId}/archivo`,
            {...this.options(), responseType: 'blob'},
        ));
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `${(numeroFactura || `factura-${comprobanteId}`).replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    }

    private options() {
        return {};
    }

    get<T>(path: string, query: Record<string, unknown> = {}): Promise<T> {
        let params = new HttpParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== null && value !== undefined && value !== '') params = params.set(key, String(value));
        }
        return firstValueFrom(this.http.get<T>(this.base + path, {...this.options(), params}));
    }

    post<T>(path: string, body: unknown = {}): Promise<T> {
        return firstValueFrom(this.http.post<T>(this.base + path, body, this.options()));
    }

    patch<T>(path: string, body: unknown = {}): Promise<T> {
        return firstValueFrom(this.http.patch<T>(this.base + path, body, this.options()));
    }
}

export interface PaginaCompras<T> {
    contenido: T[];
    pagina: number;
    tamanio: number;
    totalElementos: number;
    totalPaginas: number;
    ultima: boolean;
}

export interface CotizacionesResumen {
    total: number;
    pendientes: number;
    aprobadas: number
}

export interface OrdenesResumen {
    total: number;
    pendientes: number;
    montoPendiente: number
}

export interface CotizacionResponse {
    id: number;
    fechaCotizacion: string;
    fechaEntrega: string;
    estado: string;
    solicitudId: number;
    proveedorId: number;
    proveedorNombre: string;
    monto: number;
    detalles: {
        id: number;
        insumoId: number;
        insumoNombre: string;
        unidadMedida: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number
    }[];
    tieneOrden: boolean;
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
    id: number;
    fechaEmision: string;
    descripcion: string;
    cotizacionId: number;
    proveedorNombre: string;
    total: number;
    detalles: {
        id: number;
        insumoId: number;
        insumoNombre: string;
        unidadMedida: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number
    }[];
}

export interface OrdenCompraListadoResponse extends OrdenCompraResponse {
    comprobante: ComprobanteCompra | null;
    totalPagado: number;
    saldoPendiente: number;
}

export interface ComprobanteCompra {
    id: number;
    fechaEmision: string;
    monto: number;
    estado: string;
    ordenCompraId: number;
    numeroFactura?: string | null
}

export interface SolicitudProveedor {
    id: number;
    fecha: string;
    estado: string;
    insumos: { id: number; nombre: string; cantidad: number; unidad: string }[]
}

export interface OrdenProveedor {
    id: number;
    fecha: string;
    cotizacionId: number;
    total: number;
    estado: string;
    factura: { id: number; numero: string; fecha: string; monto: number; estado: string } | null
}

export interface PagoCompra {
    id: number;
    monto: number;
    fechaPago: string;
    comprobanteId: number;
    metodoPagoId: number;
    metodoPago: string
}

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
    comprobante: ComprobanteCompra | null;
    totalPagado: number;
    saldoPendiente: number;
    detalles: { insumo: string; cantidad: number; unidad: string; precioUnitario: number; subtotal: number }[];
}
