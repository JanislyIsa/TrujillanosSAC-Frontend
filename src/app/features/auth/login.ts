import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import { mensajeError } from '../../core/api';
import { Icon } from '../../shared/icon';
import { ComprasApi } from '../compras/compras-api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Icon],
  template: `
    <main class="login-container">
      <div class="logo"><img src="/assets/images/Eltrujillanologo.png" alt="El Trujillano"></div>
      <h1>Bienvenido</h1>
      <p class="subtitle">Ingrese sus credenciales para continuar</p>
      <div class="error-message" aria-live="polite">@if(error()){<span>{{error()}}</span>}</div>
      <form (ngSubmit)="ingresar()">
        <div class="input-group">
          <input type="text" name="username" placeholder="Ingrese su usuario" autocomplete="username" [(ngModel)]="username" maxlength="20" required [disabled]="busy()">
        </div>
        <div class="input-group password-group">
          <input [type]="mostrarPassword()?'text':'password'" name="password" placeholder="Ingrese su contraseña" autocomplete="current-password" [(ngModel)]="password" required [disabled]="busy()">
          <button class="password-toggle" type="button" aria-label="Mostrar u ocultar contraseña" (click)="mostrarPassword.update(value=>!value)"><app-icon name="eye"/></button>
        </div>
        <a class="guest-link" href="/ventas/catalogo">Seguir como cliente</a>
        <button type="submit" [disabled]="busy()||!username.trim()||!password">{{busy()?'Ingresando…':'Iniciar sesión'}}</button>
      </form>
      <div class="links"><span>¿Has olvidado la contraseña?</span><a href="#" (click)="$event.preventDefault()">Recuperar</a></div>
    </main>
  `,
  styles: [`
    :host{min-height:100dvh;display:flex;justify-content:center;align-items:center;background:#dcdcdc;color:#222;font-family:'Segoe UI',sans-serif}
    .login-container{width:100%;max-width:460px;padding:30px;text-align:center}
    .logo img{width:150px;margin-bottom:25px}
    h1{font-size:1.75rem;color:#222;margin:0 0 10px;font-weight:500;letter-spacing:normal;line-height:normal}
    .subtitle{color:#222;margin:0 0 35px;font-size:16px}
    .error-message{min-height:22px;margin-bottom:8px;color:#dc3545;font-size:14px;font-weight:500}
    .input-group{margin-bottom:18px}
    .input-group input{width:100%;height:55px;min-height:55px;border:0;border-radius:20px;padding:0 20px;background:#fff;outline:none;font-size:18px;color:#222}
    .input-group input::placeholder{color:#ededed}
    .input-group input:focus{border:0;outline:none}
    .password-group{position:relative}
    .password-toggle{position:absolute;right:20px;top:50%;transform:translateY(-50%);width:auto;height:auto;min-height:0;border:0;border-radius:0;padding:0;background:transparent;cursor:pointer;color:#111}
    .password-toggle app-icon{width:22px;height:22px}
    form>.guest-link{display:block;width:max-content;margin:0 auto 22px;color:#2f36e8;font-size:15px;font-weight:600;text-decoration:none}
    form>.guest-link:hover,.links a:hover{text-decoration:underline}
    form>button[type=submit]{width:100%;height:55px;border:0;border-radius:20px;background:#2f36e8;color:white;font-size:16px;font-weight:600;cursor:pointer;transition:.3s}
    form>button[type=submit]:hover{background:#252cd0}
    .links{margin-top:55px;display:flex;justify-content:space-between;gap:20px;font-size:18px}
    .links a{color:#2f36e8;text-decoration:none;font-weight:600}
    @media(max-width:520px){.login-container{max-width:100%;padding:24px}.links{flex-direction:column;margin-top:35px;font-size:15px}}
  `],
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly comprasApi = inject(ComprasApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly mostrarPassword = signal(false);
  username = '';
  password = '';

  constructor() {
    void this.auth.cargar().then(session => {
      if (this.comprasApi.esProveedor()) {
        void this.router.navigateByUrl('/proveedor/solicitudes', { replaceUrl: true });
        return;
      }
      if (!session) return;
      if (!session.inventario && !session.compras) {
        void this.router.navigateByUrl('/sin-acceso', { replaceUrl: true });
        return;
      }
      if (session.compras && !this.comprasApi.tieneSesion()) {
        this.error.set('Vuelve a iniciar sesión para renovar el acceso a Compras.');
        return;
      }
      void this.router.navigateByUrl(this.destino(), { replaceUrl: true });
    });
  }

  async ingresar() {
    if (this.busy() || !this.username.trim() || !this.password) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const comprasAuth = await this.comprasApi.iniciarSesion(this.username.trim(), this.password);
      if (comprasAuth.roles.includes('PROVEEDOR')) {
        await this.router.navigateByUrl('/proveedor/solicitudes', { replaceUrl: true });
        return;
      }
      this.comprasApi.cerrarSesion();
      const session = await this.auth.login(this.username.trim(), this.password);
      if (!session.inventario && !session.compras) {
        await this.router.navigateByUrl('/sin-acceso', { replaceUrl: true });
      } else {
        if (session.compras) await this.comprasApi.iniciarSesion(this.username.trim(), this.password);
        await this.router.navigateByUrl(this.destino(), { replaceUrl: true });
      }
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private destino(): string {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/dashboard';
  }
}
