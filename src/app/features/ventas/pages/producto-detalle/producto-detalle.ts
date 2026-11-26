import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { mensajeError } from '../../../../core/utils/https-errors';
import { redondear } from '../../../../core/utils/numeros';
import { Producto } from '../../models/producto.model';
import { CarritoService } from '../../services/carrito-service';
import { ProductoService } from '../../services/producto-service';
import { presentacionesDe } from '../../utils/agrupar';
import { urlImagen } from '../../../../core/utils/imagen';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; producto: Producto }
  | { tipo: 'error'; mensaje: string; noExiste: boolean };

@Component({
  selector: 'app-producto-detalle',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css',
})
export class ProductoDetalle {
  protected readonly imagen = urlImagen;
  private readonly productoService = inject(ProductoService);
  protected readonly carrito = inject(CarritoService);

  /** Parámetro :id de la ruta, enlazado con withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly estado = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.productoService.obtener(Number(id)).pipe(
          map((producto): Estado => ({ tipo: 'listo', producto })),
          catchError((e: HttpErrorResponse) =>
            of<Estado>({ tipo: 'error', mensaje: mensajeError(e), noExiste: e.status === 404 }),
          ),
          startWith<Estado>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as Estado },
  );

  protected readonly cargando = computed(() => this.estado().tipo === 'cargando');
  protected readonly fallo = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'error' ? estado : null;
  });
  protected readonly producto = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'listo' ? estado.producto : null;
  });

  /** Todo el catálogo disponible: de ahí salen las otras presentaciones del mismo producto. */
  private readonly catalogo = toSignal(
    this.productoService.listar().pipe(catchError(() => of([] as Producto[]))),
    { initialValue: [] as Producto[] },
  );
  /** Presentaciones entre las que se puede elegir (Paquete, Caja…). */
  protected readonly presentaciones = computed(() => {
    const producto = this.producto();
    return producto ? presentacionesDe(producto, this.catalogo()) : [];
  });

  /** Unidades que todavía se pueden agregar: el stock menos lo que ya está en el carrito. */
  protected readonly disponibles = computed(() => {
    const producto = this.producto();
    return producto
      ? Math.max(0, producto.stock - this.carrito.cantidadDe(producto.idProducto))
      : 0;
  });
  /** Vuelve a 1 cada vez que cambia el producto mostrado. */
  protected readonly cantidad = linkedSignal(() => (this.producto(), 1));
  protected readonly subtotal = computed(() =>
    redondear((this.producto()?.precio ?? 0) * this.cantidad()),
  );
  protected readonly sinImagen = signal(false);
  protected readonly aviso = signal('');

  protected cambiar(delta: number): void {
    this.cantidad.update((c) => Math.min(Math.max(1, c + delta), Math.max(1, this.disponibles())));
  }

  protected agregar(): void {
    const producto = this.producto();
    if (!producto) return;
    const agregadas = this.carrito.agregar(producto, this.cantidad());
    this.aviso.set(
      agregadas > 0
        ? `Agregaste ${agregadas} × ${producto.nombre} al carrito.`
        : 'Ya tienes en el carrito todas las unidades disponibles.',
    );
    this.cantidad.set(1);
  }
}
