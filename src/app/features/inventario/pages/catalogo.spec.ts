import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventarioApi } from '../../../core/api';
import { Item } from '../../../core/models';
import { CatalogoPage } from './catalogo';

describe('CatalogoPage', () => {
  let page: CatalogoPage;
  const api = { get: vi.fn(async () => ({ contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0 })) };
  const item: Item = {
    id: 2, tipoItem: 'PRODUCTO', nombre: 'Galleta', descripcion: null, precio: 1.5,
    stock: 10, stockMinimo: 2, stockLimite: 20, estadoStock: 'NORMAL', idAlmacen: 1,
    almacen: 'Principal', idCategoria: null, categoria: null, idUnidad: 1, unidad: 'unidad',
    imagenUrl: null, activo: true,
  };

  beforeEach(() => {
    api.get.mockReset();
    api.get.mockResolvedValue({ contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0 });
    TestBed.configureTestingModule({ providers: [{ provide: InventarioApi, useValue: api }] });
    page = TestBed.runInInjectionContext(() => new CatalogoPage());
  });

  it('carga productos y cambia a insumos reiniciando búsqueda y página', async () => {
    await page.cargar(2);
    expect(api.get).toHaveBeenLastCalledWith('/productos', { buscar: '', pagina: 2, tamanio: 10, activo: '' });
    page.buscar = 'harina';
    page.pagina = 4;
    page.cambiar('INSUMO');
    await Promise.resolve();
    expect(api.get).toHaveBeenLastCalledWith('/insumos', { buscar: '', pagina: 0, tamanio: 10, activo: '' });
    expect(page.buscar).toBe('');
    expect(page.pagina).toBe(0);
  });

  it('abre registros, conserva el seleccionado y al guardar recarga desde la primera página', async () => {
    page.abrir('edit', item);
    expect(page.modo()).toBe('edit');
    expect(page.seleccionado()).toEqual(item);
    page.guardado('Elemento actualizado.');
    await Promise.resolve();
    expect(page.modo()).toBeNull();
    expect(page.success()).toBe('Elemento actualizado.');
    expect(api.get).toHaveBeenLastCalledWith('/productos', { buscar: '', pagina: 0, tamanio: 10, activo: '' });
  });

  it('presenta el error de carga sin dejar el indicador ocupado', async () => {
    api.get.mockRejectedValueOnce(new Error('Fallo de prueba'));
    await page.cargar();
    expect(page.error()).toBe('Fallo de prueba');
    expect(page.busy()).toBe(false);
  });
});
