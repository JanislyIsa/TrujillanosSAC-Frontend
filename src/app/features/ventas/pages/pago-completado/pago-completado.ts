import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/https-errors';
import { Ticket } from '../../../../shared/components/ticket/ticket';
import { ComprobantePago } from '../../models/comprobante-pago.model';
import { ComprobantePagoService } from '../../services/comprobante-pago-service';

/** Pantalla a la que llega el cliente justo después de que Culqi aprueba el pago. */
@Component({
  selector: 'app-pago-completado',
  imports: [RouterLink, Ticket],
  templateUrl: './pago-completado.html',
  styleUrl: './pago-completado.css',
})
export class PagoCompletado {
  private readonly comprobanteService = inject(ComprobantePagoService);

  /** Parámetro :id de la ruta (el pedido pagado), enlazado con withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly comprobante = signal<ComprobantePago | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  protected cargar(id = Number(this.id())): void {
    this.cargando.set(true);
    this.error.set(null);
    this.comprobanteService.deUnPedido(id).subscribe({
      next: (comprobante) => {
        this.comprobante.set(comprobante);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected imprimir(): void {
    window.print();
  }
}
