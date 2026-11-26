/** Golosina del catálogo (ProductoVentaResponseDTO). El backend solo devuelve productos activos y con stock. */
export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  presentacion: string;
  imagenUrl: string;
}
