import { Routes } from '@angular/router';
import { autenticadoGuard } from '../../core/auth/auth-guard';
import { Cuenta } from './pages/cuenta/cuenta';
import { Login } from './pages/login/login';
import { RecuperarClave } from './pages/recuperar-clave/recuperar-clave';
import { Registro } from './pages/registro/registro';
import { RestablecerClave } from './pages/restablecer-clave/restablecer-clave';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: Login, title: 'Ingresar · El Trujillano' },
  { path: 'registro', component: Registro, title: 'Crear cuenta · El Trujillano' },
  {
    path: 'recuperar-clave',
    component: RecuperarClave,
    title: 'Recuperar contraseña · El Trujillano',
  },
  {
    path: 'restablecer-clave',
    component: RestablecerClave,
    title: 'Nueva contraseña · El Trujillano',
  },
  {
    path: 'cuenta',
    component: Cuenta,
    canActivate: [autenticadoGuard],
    title: 'Mi cuenta · El Trujillano',
  },
];
