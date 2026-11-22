import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/https-errors';
import { Pedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido-service';
import { tonoDe } from '../../utils/estado-pedido';

@Component({
  selector: 'app-pedidos',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private readonly pedidoService = inject(PedidoService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tono = tonoDe;

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.pedidoService.listar().subscribe({
      next: (pedidos) => {
        // Los más recientes primero.
        this.pedidos.set([...pedidos].sort((a, b) => b.idPedido - a.idPedido));
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected unidades(pedido: Pedido): number {
    return pedido.detalles.reduce((suma, d) => suma + d.cantidad, 0);
  }
}
