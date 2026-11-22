import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/https-errors';
import { coincide } from '../../../../core/utils/texto';
import { Producto } from '../../models/producto.model';
import { CarritoService } from '../../services/carrito-service';
import { ProductoService } from '../../services/producto-service';
import { agruparPorNombre } from '../../utils/agrupar';
import { urlImagen } from '../../../../core/utils/imagen';

/** Hasta cuántas unidades se avisa «últimas unidades». */
const POCO_STOCK = 10;

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  protected readonly imagen = urlImagen;
  private readonly productoService = inject(ProductoService);
  protected readonly carrito = inject(CarritoService);

  /** Texto de la búsqueda: llega desde la URL (?q=) gracias a withComponentInputBinding. */
  readonly q = input<string>();

  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categoria = signal<string | null>(null);
  protected readonly sinImagen = signal<ReadonlySet<number>>(new Set());
  protected readonly anuncio = signal('');
  protected readonly esqueletos = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly poco = POCO_STOCK;

  protected readonly texto = computed(() => (this.q() ?? '').trim());
  protected readonly categorias = computed(() =>
    [...new Set(this.productos().map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'es')),
  );
  protected readonly filtrados = computed(() => {
    const texto = this.texto();
    const categoria = this.categoria();
    return this.productos().filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        (!texto || coincide(texto, p.nombre, p.categoria, p.descripcion)),
    );
  });

  /** Una tarjeta por golosina; sus presentaciones (Paquete, Caja…) se eligen en el detalle. */
  protected readonly grupos = computed(() => agruparPorNombre(this.filtrados()));

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected agregar(producto: Producto): void {
    const agregadas = this.carrito.agregar(producto);
    this.anuncio.set(
      agregadas > 0
        ? `Se agregó ${producto.nombre} al carrito.`
        : `Ya tienes en el carrito todas las unidades disponibles de ${producto.nombre}.`,
    );
  }

  protected completo(producto: Producto): boolean {
    return this.carrito.cantidadDe(producto.idProducto) >= producto.stock;
  }

  protected imagenFallida(id: number): void {
    this.sinImagen.update((ids) => new Set(ids).add(id));
  }
}
