import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventarioApi } from '../../../core/api';
import { Item } from '../../../core/models';
import { CarritoPage } from './carrito';

describe('CarritoPage', () => {
  let page: CarritoPage;
  const api = {
    get: vi.fn(async (ruta: string) => ruta === '/insumos'
      ? { contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0 }
      : []),
    post: vi.fn(async () => ({ id: 1, codigo: 'SC_1001' })),
  };
  const item: Item = {
    id: 7, tipoItem: 'INSUMO', nombre: 'Azúcar', descripcion: null, precio: null,
    stock: 20, stockMinimo: 2, stockLimite: 30, estadoStock: 'NORMAL', idAlmacen: 1,
    almacen: 'Principal', idCategoria: null, categoria: null, idUnidad: 1, unidad: 'kg',
    imagenUrl: null, activo: true,
  };

  beforeEach(() => {
    sessionStorage.clear();
    api.get.mockClear();
    api.post.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: InventarioApi, useValue: api }] });
    page = TestBed.runInInjectionContext(() => new CarritoPage());
    page.ngOnInit();
  });

  it('carga insumos y proveedores y agrega, actualiza y quita líneas del carrito', async () => {
    await page.cargar(1);
    expect(page.pagina()).toBe(1);
    expect(api.get).toHaveBeenCalledTimes(4);
    page.agregar(item);
    page.agregar(item);
    expect(page.totalUnidades()).toBe(2);
    page.cantidad(item.id, '4');
    expect(page.totalUnidades()).toBe(4);
    expect(JSON.parse(sessionStorage.getItem('trujillanos-compras-carrito')!)[0].cantidad).toBe(4);
    page.quitar(item.id);
    expect(page.carrito()).toEqual([]);
  });

  it('valida proveedor y cantidades antes de registrar la solicitud', async () => {
    page.agregar(item);
    await page.registrar();
    expect(page.error()).toContain('Selecciona un proveedor');
    expect(api.post).not.toHaveBeenCalled();

    page.proveedor = 3;
    page.cantidad(item.id, '1.5');
    await page.registrar();
    expect(page.error()).toContain('cantidades enteras');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('registra la solicitud, vacía el carrito y muestra el código de respuesta', async () => {
    page.proveedor = 3;
    page.agregar(item);
    await page.registrar();
    expect(api.post).toHaveBeenCalledWith('/solicitudes-compra', {
      idProveedor: 3,
      detalles: [{ idInsumo: item.id, cantidad: 1 }],
    });
    expect(page.carrito()).toEqual([]);
    expect(page.success()).toContain('SC_1001');
  });
});
