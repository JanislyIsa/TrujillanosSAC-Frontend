import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth';
import { InventarioApi, mensajeError } from '../core/api';
import { Icon } from '../shared/icon';
@Component({selector:'app-layout',imports:[RouterLink,RouterLinkActive,RouterOutlet,Icon],templateUrl:'./layout.html'})
export class Layout {
  readonly auth=inject(AuthService);private readonly api=inject(InventarioApi);private readonly router=inject(Router);
  readonly menuAbierto=signal(false);readonly saliendo=signal(false);readonly error=signal('');
  constructor(){void this.api.get('/csrf').catch(()=>{});}
  async salir(){if(this.saliendo())return;this.saliendo.set(true);try{await this.auth.logout();await this.router.navigateByUrl('/login',{replaceUrl:true});}catch(e){this.error.set(mensajeError(e));}finally{this.saliendo.set(false);}}
  cerrarMenu(){this.menuAbierto.set(false);}
}
