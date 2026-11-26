import { computed, Service, signal } from '@angular/core';
import { redondear } from '../../../core/utils/numeros';
import { LineaCarrito } from '../models/carrito.model';
import { Producto } from '../models/producto.model';

const CLAVE = 'trujillano.carrito';

/**
 * Carrito de compras del cliente. Vive en el navegador: el backend recién conoce la compra
 * cuando se crea el pedido, y ahí recalcula precios y revisa el stock.
 */
@Service()
export class CarritoService {
  private readonly lineas = signal<LineaCarrito[]>(this.leer());

  readonly items = this.lineas.asReadonly();
  readonly cantidadTotal = computed(() => this.lineas().reduce((suma, l) => suma + l.cantidad, 0));
  /** Total estimado: el backend vuelve a calcularlo con los precios vigentes al crear el pedido. */
  readonly total = computed(() =>
    redondear(this.lineas().reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0)),
  );

  /** Unidades de un producto que ya están en el carrito. */
  cantidadDe(idProducto: number): number {
    return this.lineas().find((l) => l.producto.idProducto === idProducto)?.cantidad ?? 0;
  }

  /** Agrega unidades sin pasar del stock. Devuelve cuántas se agregaron realmente. */
  agregar(producto: Producto, cantidad = 1): number {
    const actual = this.cantidadDe(producto.idProducto);
    const agregadas = Math.max(0, Math.min(cantidad, producto.stock - actual));
    if (agregadas === 0) return 0;
    this.lineas.update((lineas) =>
      actual === 0
        ? [...lineas, { producto, cantidad: agregadas }]
        : lineas.map((l) =>
            l.producto.idProducto === producto.idProducto
              ? { producto, cantidad: l.cantidad + agregadas }
              : l,
          ),
    );
    this.guardar();
    return agregadas;
  }

  /** Fija la cantidad de una línea, entre 1 y el stock del producto. */
  cambiarCantidad(idProducto: number, cantidad: number): void {
    this.lineas.update((lineas) =>
      lineas.map((l) =>
        l.producto.idProducto === idProducto
          ? { ...l, cantidad: Math.min(Math.max(1, cantidad), Math.max(1, l.producto.stock)) }
          : l,
      ),
    );
    this.guardar();
  }

  quitar(idProducto: number): void {
    this.lineas.update((lineas) => lineas.filter((l) => l.producto.idProducto !== idProducto));
    this.guardar();
  }

  vaciar(): void {
    this.lineas.set([]);
    this.guardar();
  }

  private guardar(): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.lineas()));
    } catch {
      // Sin almacenamiento disponible: el carrito sigue funcionando mientras la página esté abierta.
    }
  }

  private leer(): LineaCarrito[] {
    try {
      const datos: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
      if (!Array.isArray(datos)) return [];
      return datos.filter(
        (l): l is LineaCarrito =>
          typeof l?.cantidad === 'number' &&
          l.cantidad > 0 &&
          typeof l?.producto?.idProducto === 'number' &&
          typeof l?.producto?.precio === 'number' &&
          typeof l?.producto?.stock === 'number',
      );
    } catch {
      return [];
    }
  }
}
