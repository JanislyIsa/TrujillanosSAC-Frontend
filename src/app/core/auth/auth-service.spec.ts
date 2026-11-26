import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('guarda la sesión y permite el acceso de empleado a su módulo', async () => {
    const respuesta = firstValueFrom(auth.login('jefe', 'secreto'));
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jwt', tipo: 'Bearer', expiraEnSegundos: 600, username: 'jefe', nombreCompleto: 'Ana Jefa',
      correo: null, roles: ['EMPLEADO'], permisos: [], cargo: 'JEFE_COMPRAS', inventario: false, compras: true,
    });
    await respuesta;
    expect(auth.autenticado()).toBe(true);
    expect(auth.puede('compras')).toBe(true);
    expect(auth.puede('inventario')).toBe(false);
    expect(auth.primerNombre()).toBe('Ana');
    expect(JSON.parse(sessionStorage.getItem('trujillano.sesion')!).username).toBe('jefe');
  });

  it('descarta sesiones vencidas guardadas y cierra una sesión activa', async () => {
    sessionStorage.setItem('trujillano.sesion', JSON.stringify({ token: 'viejo', expiraEn: 1, roles: [] }));
    const nueva = TestBed.runInInjectionContext(() => new AuthService());
    expect(nueva.sesion()).toBeNull();

    const respuesta = firstValueFrom(auth.login('cliente', 'secreto'));
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jwt', tipo: 'Bearer', expiraEnSegundos: 600, username: 'cliente', nombreCompleto: 'Luis Test',
      correo: 'luis@example.test', roles: ['CLIENTE'], permisos: [], cargo: null, inventario: false, compras: false,
    });
    await respuesta;
    auth.cerrarSesion();
    expect(auth.autenticado()).toBe(false);
    expect(sessionStorage.getItem('trujillano.sesion')).toBeNull();
  });
});
