import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventarioApi } from '../../../core/api';
import { Comprobante } from '../../../core/models';
import { MovimientosPage } from './movimientos';

describe('MovimientosPage', () => {
  let page: MovimientosPage;
  const comprobante = { movimiento: { idMovimiento: 9 } } as Comprobante;
  const api = {
    get: vi.fn(async (ruta: string) => ruta.includes('/comprobante') ? comprobante : {
      contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0,
    }),
  };

  beforeEach(() => {
    api.get.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: InventarioApi, useValue: api }] });
    page = TestBed.runInInjectionContext(() => new MovimientosPage());
    api.get.mockClear();
  });

  it('rechaza rangos de fecha inválidos y consulta con filtros válidos', async () => {
    page.desde = '2026-11-24';
    page.hasta = '2026-11-20';
    await page.cargar();
    expect(page.error()).toContain('fecha de inicio');
    expect(api.get).not.toHaveBeenCalled();

    page.hasta = '2026-11-30';
    page.tipoMovimiento = 'INGRESO';
    page.tipoItem = 'INSUMO';
    await page.cargar(1);
    expect(api.get).toHaveBeenLastCalledWith('/movimientos', {
      pagina: 1, tamanio: 10, tipoMovimiento: 'INGRESO', tipoItem: 'INSUMO', desde: '2026-11-24', hasta: '2026-11-30',
    });
    expect(page.busy()).toBe(false);
  });

  it('consulta un comprobante y al registrar muestra confirmación', async () => {
    await page.ver(9);
    expect(page.comprobante()).toEqual(comprobante);
    expect(page.consultando()).toBeNull();
    page.registrar.set(true);
    page.guardado(comprobante);
    await Promise.resolve();
    expect(page.registrar()).toBe(false);
    expect(page.success()).toContain('existencias se actualizaron');
  });
});
