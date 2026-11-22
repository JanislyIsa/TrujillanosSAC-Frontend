import { Producto } from './producto.model';

export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}
