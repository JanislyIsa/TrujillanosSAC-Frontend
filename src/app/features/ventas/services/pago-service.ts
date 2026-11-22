import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Pago, PagoCulqiRequest } from '../models/pedido.model';

@Service()
export class PagoService {
  private readonly http = inject(HttpClient);

  /** El monto no se envía: el backend cobra el total del pedido. */
  pagarConCulqi(pago: PagoCulqiRequest): Observable<Pago> {
    return this.http.post<Pago>(`${environment.apiUrl}/ventas/pagos/culqi`, pago);
  }
}
