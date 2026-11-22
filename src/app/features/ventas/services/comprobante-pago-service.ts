import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ComprobantePago } from '../models/comprobante-pago.model';

@Service()
export class ComprobantePagoService {
  private readonly http = inject(HttpClient);

  /** Solo existe para pedidos pagados; el backend responde 4xx si el pedido no es del cliente o no está pagado. */
  deUnPedido(pedidoId: number): Observable<ComprobantePago> {
    return this.http.get<ComprobantePago>(
      `${environment.apiUrl}/ventas/pedidos/${pedidoId}/comprobante-pago`,
    );
  }
}
