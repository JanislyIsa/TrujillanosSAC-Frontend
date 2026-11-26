import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { mensajeError } from '../../../../core/utils/https-errors';
import { redondear } from '../../../../core/utils/numeros';
import { LineaCarrito } from '../../models/carrito.model';
import { CarritoService } from '../../services/carrito-service';
import { PedidoService } from '../../services/pedido-service';
import { urlImagen } from '../../../../core/utils/imagen';

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito {
  protected readonly imagen = urlImagen;
  protected readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);
  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);
  protected readonly creando = signal(false);
  protected readonly errorPedido = signal<string | null>(null);
  protected readonly sinImagen = signal<ReadonlySet<number>>(new Set());
  protected readonly anuncio = signal('');

  protected subtotal(linea: LineaCarrito): number {
    return redondear(linea.producto.precio * linea.cantidad);
  }

  protected cambiar(linea: LineaCarrito, delta: number): void {
    this.carrito.cambiarCantidad(linea.producto.idProducto, linea.cantidad + delta);
  }

  protected quitar(linea: LineaCarrito): void {
    this.carrito.quitar(linea.producto.idProducto);
    this.anuncio.set(`Se quitó ${linea.producto.nombre} del carrito.`);
  }

  protected vaciar(): void {
    this.carrito.vaciar();
    this.anuncio.set('Se vació el carrito.');
  }

  /** Crea el pedido (el backend reserva el stock) y sigue a la pantalla de pago. */
  protected hacerPedido(): void {
    if (this.creando()) return;
    this.creando.set(true);
    this.errorPedido.set(null);
    this.pedidoService.crear(this.carrito.items()).subscribe({
      next: (pedido) => {
        this.carrito.vaciar();
        void this.router.navigate(['/pedidos', pedido.idPedido]);
      },
      error: (e: HttpErrorResponse) => {
        this.errorPedido.set(mensajeError(e));
        this.creando.set(false);
      },
    });
  }

  protected imagenFallida(id: number): void {
    this.sinImagen.update((ids) => new Set(ids).add(id));
  }
}
