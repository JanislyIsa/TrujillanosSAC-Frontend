import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LineaCarrito } from '../models/carrito.model';
import { Pedido } from '../models/pedido.model';

@Service()
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas/pedidos`;

  /** Crea el pedido y reserva el stock. El cliente es siempre quien tiene la sesión iniciada. */
  crear(lineas: readonly LineaCarrito[]): Observable<Pedido> {
    const detalles = lineas.map((l) => ({ productoId: l.producto.idProducto, cantidad: l.cantidad }));
    return this.http.post<Pedido>(this.url, { detalles });
  }

  listar(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.url);
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.url}/${id}`);
  }
}
