import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pagina } from './models';
/** Base de los endpoints de inventario. El token JWT lo agrega authInterceptor; no hay cookies ni CSRF. */
export const API = `${environment.apiUrl}/inventario`;
export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Comprueba la conexión y vuelve a intentar.';
    if (error.status === 401) return 'Tu sesión terminó. Vuelve a iniciar sesión para continuar.';
    if (error.status === 403) return 'No tienes permiso para esta operación o la sesión cambió. Actualiza la página.';
    const campos = error.error?.errores as Record<string,string>|undefined;
    const detalles = campos ? Object.values(campos).filter(Boolean).join('. ') : '';
    return error.error?.mensaje ? error.error.mensaje + (detalles ? ': '+detalles : '') : 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
@Injectable({ providedIn:'root' })
export class InventarioApi {
  private readonly http=inject(HttpClient);
  private parametros(query: Record<string, unknown>): HttpParams {
    let params=new HttpParams();
    for (const [key,value] of Object.entries(query)) if(value!==null && value!==undefined && value!=='') params=params.set(key,String(value));
    return params;
  }
  get<T>(ruta:string,query:Record<string,unknown>={}):Promise<T> {
    return firstValueFrom(this.http.get<T>(API+ruta,{params:this.parametros(query)}));
  }
  post<T>(ruta:string,body:unknown):Promise<T> { return firstValueFrom(this.http.post<T>(API+ruta,body)); }
  put<T>(ruta:string,body:unknown):Promise<T> { return firstValueFrom(this.http.put<T>(API+ruta,body)); }
  patch<T>(ruta:string,body:unknown={}):Promise<T> { return firstValueFrom(this.http.patch<T>(API+ruta,body)); }
  delete(ruta:string):Promise<void> { return firstValueFrom(this.http.delete<void>(API+ruta)); }
  async todos<T>(ruta:string,query:Record<string,unknown>={}):Promise<T[]> {
    const primero=await this.get<Pagina<T>>(ruta,{...query,pagina:0,tamanio:100});
    const items=[...primero.contenido];
    for(let pagina=1;pagina<primero.totalPaginas;pagina++) items.push(...(await this.get<Pagina<T>>(ruta,{...query,pagina,tamanio:100})).contenido);
    return items;
  }
  async subir(archivo:File):Promise<string> {
    const form=new FormData(); form.append('archivo',archivo);
    return (await this.post<{ruta:string}>('/imagenes',form)).ruta;
  }
}
