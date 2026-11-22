import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CarritoService } from '../../features/ventas/services/carrito-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly router = inject(Router);
  protected readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);

  /** La búsqueda lleva al catálogo con ?q=texto; el catálogo filtra según ese parámetro. */
  protected buscar(evento: Event, texto: string): void {
    evento.preventDefault();
    this.router.navigate(['/catalogo'], { queryParams: { q: texto.trim() || null } });
  }
}
