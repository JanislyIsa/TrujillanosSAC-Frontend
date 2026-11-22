/** Valor de un catálogo del backend (estado, método de pago, tipo de comprobante…). */
export interface Catalogo {
  id: number;
  codigo: string;
  nombre: string;
}

export interface DetallePedido {
  idDetalle: number;
  productoId: number;
  nombreProducto: string;
  /** Paquete, Caja… */
  presentacion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  idPedido: number;
  /** ISO local, sin zona horaria (LocalDateTime del backend). */
  fechaRegistro: string;
  clienteId: number;
  estado: Catalogo;
  total: number;
  detalles: DetallePedido[];
}

export interface PagoCulqiRequest {
  pedidoId: number;
  /** Token de Culqi Checkout (tarjeta o Yape). */
  token: string;
  email: string;
}

export interface Pago {
  idPago: number;
  pedidoId: number;
  metodoPago: Catalogo;
  estado: Catalogo;
  fechaPago: string | null;
  monto: number;
  moneda: string;
  referenciaExterna: string | null;
  mensaje: string | null;
}
