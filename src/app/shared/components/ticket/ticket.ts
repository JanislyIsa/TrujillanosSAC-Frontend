import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ComprobantePago } from '../../../features/ventas/models/comprobante-pago.model';

/**
 * Comprobante de pago con dos presentaciones del mismo contenido:
 * - En pantalla: tarjeta con tabla, con el diseño del profesor.
 * - Al imprimir: ticket de 80 mm (ticketera), parecido al que se envía por correo.
 */
@Component({
  selector: 'app-ticket',
  imports: [CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
})
export class Ticket {
  readonly comprobante = input.required<ComprobantePago>();

  /** «B001-00000012»; mientras no haya comprobante emitido, el número del pedido (igual que el correo). */
  protected readonly numero = computed(() => {
    const c = this.comprobante();
    return c.serie && c.numero ? `${c.serie}-${c.numero}` : `Pedido N.º ${c.pedidoId}`;
  });

  protected readonly titulo = computed(
    () => this.comprobante().nombreComprobante ?? 'Comprobante de pedido',
  );

  protected readonly fecha = computed(() => {
    const c = this.comprobante();
    return c.fechaPago ?? c.fechaEmision ?? c.fechaPedido;
  });

  /** Color de la etiqueta de estado (clases globales .estado--…): el comprobante existe solo si se pagó. */
  protected readonly tono = computed(() =>
    /cancel|anul|rechaz/i.test(this.comprobante().estadoPedido) ? 'error' : 'exito',
  );
}
