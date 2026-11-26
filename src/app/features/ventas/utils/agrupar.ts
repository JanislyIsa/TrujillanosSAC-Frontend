import { normalizar } from '../../../core/utils/texto';
import { Producto } from '../models/producto.model';

/**
 * Una misma golosina puede venderse en varias presentaciones (Paquete, Caja…). En el backend cada
 * presentación es un producto distinto, con su propio id, precio y stock, que comparten el nombre.
 */
export interface GrupoProducto {
  clave: string;
  nombre: string;
  /** Presentaciones disponibles, de la más barata a la más cara. */
  opciones: Producto[];
}

export function agruparPorNombre(productos: readonly Producto[]): GrupoProducto[] {
  const grupos = new Map<string, GrupoProducto>();
  for (const producto of productos) {
    const clave = normalizar(producto.nombre);
    const grupo = grupos.get(clave) ?? { clave, nombre: producto.nombre, opciones: [] };
    grupo.opciones.push(producto);
    grupos.set(clave, grupo);
  }
  for (const grupo of grupos.values()) grupo.opciones.sort((a, b) => a.precio - b.precio);
  return [...grupos.values()];
}

/** Presentaciones del mismo producto (incluido él mismo), de la más barata a la más cara. */
export function presentacionesDe(producto: Producto, todos: readonly Producto[]): Producto[] {
  const clave = normalizar(producto.nombre);
  const mismas = todos.filter((p) => normalizar(p.nombre) === clave);
  const opciones = mismas.some((p) => p.idProducto === producto.idProducto) ? mismas : [producto, ...mismas];
  return [...opciones].sort((a, b) => a.precio - b.precio);
}
