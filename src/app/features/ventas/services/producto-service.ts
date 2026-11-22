import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Producto } from '../models/producto.model';

/** Catálogo público: no necesita sesión. */
@Service()
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas/productos`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.url);
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }
}
