import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { InventarioApi } from './api';

describe('InventarioApi', () => {
  let api: InventarioApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(InventarioApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('construye consultas paginadas y omite filtros vacíos', async () => {
    const promise = api.get<{ contenido: string[] }>('/insumos', { buscar: 'azúcar', vacio: '', pagina: 2 });
    const request = http.expectOne(r => r.url === `${environment.apiUrl}/inventario/insumos`);
    expect(request.request.params.get('buscar')).toBe('azúcar');
    expect(request.request.params.get('pagina')).toBe('2');
    expect(request.request.params.has('vacio')).toBe(false);
    request.flush({ contenido: ['azúcar'] });
    await expect(promise).resolves.toEqual({ contenido: ['azúcar'] });
  });

  it('recorre todas las páginas al solicitar todos los registros', async () => {
    const promise = api.todos<{ id: number }>('/stock');
    http.expectOne(r => r.url.endsWith('/stock') && r.params.get('pagina') === '0')
      .flush({ contenido: [{ id: 1 }], pagina: 0, tamanio: 100, totalElementos: 2, totalPaginas: 2 });
    await Promise.resolve();
    http.expectOne(r => r.url.endsWith('/stock') && r.params.get('pagina') === '1')
      .flush({ contenido: [{ id: 2 }], pagina: 1, tamanio: 100, totalElementos: 2, totalPaginas: 2 });
    await expect(promise).resolves.toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('envía archivos como multipart sin fijar el content-type', async () => {
    const archivo = new File(['imagen'], 'item.png', { type: 'image/png' });
    const promise = api.subir(archivo);
    const request = http.expectOne(r => r.url.endsWith('/imagenes'));
    expect(request.request.body).toBeInstanceOf(FormData);
    expect(request.request.body.get('archivo')).toBe(archivo);
    request.flush({ ruta: '/img/item.png' });
    await expect(promise).resolves.toBe('/img/item.png');
  });
});
