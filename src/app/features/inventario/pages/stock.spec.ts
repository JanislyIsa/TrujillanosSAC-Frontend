import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventarioApi } from '../../../core/api';
import { AuthService } from '../../../core/auth/auth-service';
import { Item } from '../../../core/models';
import { StockPage } from './stock';

describe('StockPage', () => {
  let page: StockPage;
  const bajo: Item = {
    id: 1, tipoItem: 'INSUMO', nombre: 'Harina', descripcion: null, precio: null,
    stock: 1, stockMinimo: 3, stockLimite: 20, estadoStock: 'BAJO', idAlmacen: 1,
    almacen: 'Principal', idCategoria: null, categoria: null, idUnidad: 1, unidad: 'kg',
    imagenUrl: null, activo: true,
  };
  const sobre: Item = { ...bajo, id: 2, nombre: 'Azúcar', estadoStock: 'SOBRESTOCK', stock: 30 };
  const api = {
    todos: vi.fn(async () => [bajo, sobre]),
    get: vi.fn(async (ruta: string) => ruta === '/catalogos'
      ? { almacenes: [{ id: 1, nombre: 'Principal' }], categorias: [], presentaciones: [], unidadesMedida: [] }
      : { contenido: [bajo], pagina: 0, tamanio: 10, totalElementos: 1, totalPaginas: 1 }),
  };
  const auth = {};

  beforeEach(() => {
    api.todos.mockClear();
    api.get.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: InventarioApi, useValue: api }, { provide: AuthService, useValue: auth }] });
    page = TestBed.runInInjectionContext(() => new StockPage());
  });

  it('carga existencias, almacenes y cuenta alertas de stock', async () => {
    await page.iniciar();
    expect(page.bajo()).toBe(1);
    expect(page.sobre()).toBe(1);
    expect(page.almacenes()).toEqual([{ id: 1, nombre: 'Principal' }]);
    expect(page.data()?.contenido).toEqual([bajo]);
    expect(api.todos).toHaveBeenCalledWith('/stock');
    expect(api.get).toHaveBeenCalledWith('/catalogos');
  });

  it('aplica filtros de búsqueda y restablece el estado de carga al terminar', async () => {
    page.buscar = 'harina';
    page.tipoItem = 'INSUMO';
    page.estado = 'BAJO';
    page.idAlmacen = '1';
    await page.cargar(2);
    expect(api.get).toHaveBeenLastCalledWith('/stock', {
      pagina: 2, tamanio: 10, buscar: 'harina', tipoItem: 'INSUMO', estado: 'BAJO', idAlmacen: '1',
    });
    expect(page.busy()).toBe(false);
    expect(page.pagina).toBe(2);
  });
});
