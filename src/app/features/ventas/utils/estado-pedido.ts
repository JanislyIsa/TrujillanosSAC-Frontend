/** Estados en los que el pedido ya se cobró. */
export const ESTADOS_PAGADOS: readonly string[] = ['PAGADO', 'LISTO_PARA_RECOJO', 'ENTREGADO'];

export type Tono = 'aviso' | 'info' | 'exito' | 'error';

/** Color con que se muestra cada estado del pedido. */
export function tonoDe(codigo: string): Tono {
  switch (codigo) {
    case 'PENDIENTE':
      return 'aviso';
    case 'PROCESANDO_PAGO':
      return 'info';
    case 'CANCELADO':
      return 'error';
    default:
      return 'exito';
  }
}

/** Frase corta que explica en qué punto está el pedido. */
export function explicacionDe(codigo: string): string {
  switch (codigo) {
    case 'PENDIENTE':
      return 'Tu pedido está reservado, falta pagarlo.';
    case 'PROCESANDO_PAGO':
      return 'Estamos confirmando tu pago.';
    case 'PAGADO':
      return 'Recibimos tu pago. Estaremos preparando tu pedido.';
    case 'LISTO_PARA_RECOJO':
      return 'Tu pedido está listo para recojo.';
    case 'ENTREGADO':
      return 'Pedido entregado. ¡Gracias por tu compra!';
    case 'CANCELADO':
      return 'Este pedido fue cancelado y su stock volvió al inventario.';
    default:
      return '';
  }
}
