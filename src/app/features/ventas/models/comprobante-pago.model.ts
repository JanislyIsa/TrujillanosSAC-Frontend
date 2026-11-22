/** Línea del comprobante de pago. */
export interface ItemComprobantePago {
  productoId: number;
  descripcion: string;
  presentacion: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Todo lo que necesita el ticket, tal como lo entrega el backend
 * (GET /api/v1/ventas/pedidos/{id}/comprobante-pago → ComprobantePagoDTO).
 * Las fechas llegan en ISO local, sin zona horaria (LocalDateTime).
 */
export interface ComprobantePago {
  negocio: {
    razonSocial: string;
    ruc: string | null;
    direccion: string | null;
  };
  /** BOLETA o FACTURA; null si el pedido todavía no tiene comprobante emitido. */
  tipoComprobante: string | null;
  /** Nombre legible del tipo («Boleta de venta»); null si no hay comprobante. */
  nombreComprobante: string | null;
  /** B001 / F001; null si no hay comprobante. */
  serie: string | null;
  /** Correlativo de 8 dígitos; null si no hay comprobante. */
  numero: string | null;
  fechaEmision: string | null;
  pedidoId: number;
  fechaPedido: string;
  /** Nombre del estado del pedido (Pagado, Listo para recojo, Entregado). */
  estadoPedido: string;
  cliente: {
    nombreCompleto: string;
    tipoDocumento: string | null;
    numeroDocumento: string | null;
    correo: string | null;
  };
  items: ItemComprobantePago[];
  unidades: number;
  total: number;
  moneda: string;
  metodoPago: string | null;
  /** Número de operación de la pasarela (Culqi); null si no hay. */
  referenciaOperacion: string | null;
  fechaPago: string | null;
  estadoSunat: string;
  /** Aviso legal al pie; null cuando el comprobante ya fue aceptado por SUNAT. */
  leyenda: string | null;
}
