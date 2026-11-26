import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventarioApi } from '../../../core/api';
import { Solicitud } from '../../../core/models';
import { SolicitudesPage } from './solicitudes';

describe('SolicitudesPage', () => {
  let page: SolicitudesPage;
  const solicitud: Solicitud = {
    id: 5, codigo: 'SC_1005', fecha: '2026-11-24', estado: 'PENDIENTE', idProveedor: 8,
    idEmpleado: 1, detalles: [],
  };
  const api = {
    todos: vi.fn(async (ruta: string) => ruta === '/solicitudes-compra' ? [solicitud] : []),
    get: vi.fn(async () => [{ id: 8, nombre: 'Proveedor Uno' }]),
  };

  beforeEach(() => {
    api.todos.mockClear();
    api.get.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: InventarioApi, useValue: api }] });
    page = TestBed.runInInjectionContext(() => new SolicitudesPage());
  });

  it('carga solicitudes, proveedores y faltantes para buscar y paginar', async () => {
    await page.cargar();
    expect(page.proveedor(8)).toBe('Proveedor Uno');
    expect(page.proveedor(99)).toBe('Proveedor #99');
    expect(page.filtradas()).toHaveLength(1);
    page.buscar.set('no existe');
    expect(page.filtradas()).toEqual([]);
    expect(page.paginas()).toBe(0);
    expect(api.todos).toHaveBeenCalledWith('/solicitudes-compra');
    expect(api.todos).toHaveBeenCalledWith('/solicitudes-compra/faltantes');
  });

  it('al guardar una solicitud informa su código y abre el detalle', async () => {
    page.nuevo.set('manual');
    page.guardado(solicitud);
    await Promise.resolve();
    expect(page.nuevo()).toBeNull();
    expect(page.detalle()).toEqual(solicitud);
    expect(page.success()).toContain('SC_1005');
  });
});
