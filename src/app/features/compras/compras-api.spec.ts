import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth-service';
import { ComprasApi } from './compras-api';

describe('ComprasApi', () => {
  let api: ComprasApi;
  let http: HttpTestingController;
  const auth = { esProveedor: vi.fn(() => true), sesion: vi.fn(() => ({ username: 'proveedor', nombreCompleto: 'Proveedor Demo' })) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: auth }],
    });
    api = TestBed.inject(ComprasApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('expone identidad de proveedor y consulta solicitudes con filtros', async () => {
    expect(api.esProveedor()).toBe(true);
    expect(api.nombreUsuario()).toBe('Proveedor Demo');
    const promise = api.solicitudesProveedor({ pagina: 1, buscar: 'SC_10', estado: '' });
    const request = http.expectOne(r => r.url === `${environment.apiUrl}/compras/proveedor/solicitudes`);
    expect(request.request.params.get('pagina')).toBe('1');
    expect(request.request.params.get('buscar')).toBe('SC_10');
    expect(request.request.params.has('estado')).toBe(false);
    request.flush({ contenido: [], pagina: 1, tamanio: 10, totalElementos: 0, totalPaginas: 0, ultima: true });
    await expect(promise).resolves.toMatchObject({ contenido: [], ultima: true });
  });

  it('envía IDs de cotizaciones como lista y factura como multipart', async () => {
    const orders = api.ordenesProveedor([4, 8]);
    const request = http.expectOne(r => r.url.endsWith('/proveedor/ordenes'));
    expect(request.request.params.get('cotizacionIds')).toBe('4,8');
    request.flush([]);
    await expect(orders).resolves.toEqual([]);

    const file = new File(['pdf'], 'factura.pdf', { type: 'application/pdf' });
    const invoice = api.enviarFactura({ ordenCompraId: 12, numeroFactura: 'F-12', fechaEmision: '2026-11-24', monto: 45, archivo: file });
    const upload = http.expectOne(`${environment.apiUrl}/compras/comprobantes/factura`);
    expect(upload.request.body).toBeInstanceOf(FormData);
    expect(upload.request.body.get('ordenCompraId')).toBe('12');
    expect(upload.request.body.get('archivo')).toBe(file);
    upload.flush(null);
    await expect(invoice).resolves.toBeUndefined();
  });
});
