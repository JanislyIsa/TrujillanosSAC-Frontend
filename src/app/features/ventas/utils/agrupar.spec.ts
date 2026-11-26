import { describe, expect, it } from 'vitest';
import { agruparPorNombre, presentacionesDe } from './agrupar';
import { Producto } from '../models/producto.model';

const producto = (idProducto: number, nombre: string, precio: number): Producto => ({
  idProducto, nombre, precio, descripcion: '', stock: 5, categoria: 'Dulces', presentacion: 'Unidad', imagenUrl: '',
});

describe('agrupación de presentaciones', () => {
  it('agrupa nombres ignorando tildes y mayúsculas y ordena por precio', () => {
    const grupos = agruparPorNombre([
      producto(1, 'Gomita Ácida', 3), producto(2, 'gomita acida', 1), producto(3, 'Chicle', 2),
    ]);
    expect(grupos).toHaveLength(2);
    expect(grupos.find((g) => g.clave === 'gomita acida')?.opciones.map((p) => p.precio)).toEqual([1, 3]);
  });

  it('devuelve solo las presentaciones equivalentes y agrega el producto si no estaba en la lista', () => {
    const base = producto(1, 'Gomita Ácida', 3);
    const otra = producto(2, 'gomita acida', 1);
    const ajena = producto(3, 'Chicle', 2);
    expect(presentacionesDe(base, [otra, ajena]).map((p) => p.idProducto)).toEqual([2, 1]);
    expect(presentacionesDe(base, [base, otra]).map((p) => p.idProducto)).toEqual([2, 1]);
  });
});
