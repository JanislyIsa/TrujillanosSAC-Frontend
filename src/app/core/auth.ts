import { inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { InventarioApi,API } from './api';
import { HttpErrorResponse,HttpInterceptorFn } from '@angular/common/http';
import { catchError,throwError } from 'rxjs';
import { Sesion } from './models';
@Injectable({ providedIn:'root' })
export class SesionStore { readonly sesion=signal<Sesion|null>(null); }
@Injectable({ providedIn:'root' })
export class AuthService {
  private readonly api=inject(InventarioApi);
  readonly sesion=inject(SesionStore).sesion;
  private consulta?:Promise<Sesion|null>;
  async cargar():Promise<Sesion|null> {
    if(this.sesion()) return this.sesion();
    this.consulta ??= this.api.get<Sesion>('/sesion').then(s => { this.sesion.set(s); return s; }).catch(() => null).finally(() => { this.consulta=undefined; });
    return this.consulta;
  }
  async login(username:string,password:string):Promise<Sesion> {
    sessionStorage.removeItem('trujillanos.compras.jwt');
    sessionStorage.removeItem('trujillanos.compras.jwt.expiresAt');
    await this.api.get('/csrf');
    const sesion=await this.api.post<Sesion>('/sesion/login',{username,password});
    this.sesion.set(sesion);
    await this.api.get('/csrf');
    return sesion;
  }
  async logout():Promise<void> {
    sessionStorage.removeItem('trujillanos.compras.jwt');
    sessionStorage.removeItem('trujillanos.compras.jwt.expiresAt');
    await this.api.get('/csrf');
    await this.api.post('/sesion/logout',{});
    this.sesion.set(null);
  }
}
export const authGuard:CanActivateFn=async (_route,state) => {
  const auth=inject(AuthService),router=inject(Router);
  const sesion=await auth.cargar();
  if(!sesion) return router.createUrlTree(['/login'],{queryParams:{returnUrl:state.url}});
  if(!sesion.inventario && !sesion.compras) return router.createUrlTree(['/sin-acceso']);
  return true;
};
export const permisoGuard:CanActivateFn=async route => {
  const auth=inject(AuthService),router=inject(Router);
  const sesion=await auth.cargar();
  return !!sesion?.[route.data['permiso'] as 'inventario'|'compras'] || router.createUrlTree(['/sin-acceso']);
};

export const sesionInterceptor:HttpInterceptorFn=(request,next)=>{
  const store=inject(SesionStore),router=inject(Router);
  return next(request).pipe(catchError(error=>{
    if(error instanceof HttpErrorResponse && error.status===401 && request.url.startsWith(API)){
      store.sesion.set(null);
      if(!request.url.endsWith('/sesion/login')&&!request.url.endsWith('/sesion'))void router.navigateByUrl('/login');
    }
    return throwError(()=>error);
  }));
};
