import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Respuesta de POST /api/v1/auth/login (LoginResponseDTO del backend). */
interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  username: string;
  nombreCompleto: string;
  correo: string | null;
  roles: string[];
  permisos: string[];
  /** Cargo del empleado (ALMACENERO, JEFE_DE_COMPRAS…); null si no es empleado. */
  cargo: string | null;
  /** El empleado puede entrar al módulo de inventario / de compras (según su cargo). */
  inventario: boolean;
  compras: boolean;
}

export interface Sesion {
  token: string;
  username: string;
  nombreCompleto: string;
  /** Correo del cliente; null si no tiene. Las sesiones guardadas antes de este cambio no lo traen. */
  correo?: string | null;
  roles: string[];
  permisos: string[];
  /** Cargo del empleado; null si no es empleado. Las sesiones guardadas antes de este cambio no lo traen. */
  cargo?: string | null;
  /** Módulos de la intranet a los que puede entrar (solo empleados). */
  inventario?: boolean;
  compras?: boolean;
  /** Instante (ms desde 1970) en que el token deja de valer. */
  expiraEn: number;
}

/** Datos para crear la cuenta de cliente (POST /api/v1/auth/registro). */
export interface RegistroCliente {
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  correo: string;
  username: string;
  password: string;
}

const CLAVE = 'trujillano.sesion';

/** Módulos de la intranet que se controlan por cargo. */
export type ModuloIntranet = 'inventario' | 'compras';

/**
 * Sesión con JWT (clientes y empleados). Se guarda en sessionStorage: se pierde al cerrar la pestaña,
 * que es lo más prudente para un token (no queda en disco como localStorage).
 */
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _sesion = signal<Sesion | null>(this.leer());

  readonly sesion = this._sesion.asReadonly();
  readonly autenticado = computed(() => this._sesion() !== null);
  readonly token = computed(() => this._sesion()?.token ?? null);
  readonly correo = computed(() => this._sesion()?.correo ?? null);
  readonly esEmpleado = computed(() => this._sesion()?.roles.includes('EMPLEADO') ?? false);
  /** Proveedor de insumos: entra al portal de proveedores (/proveedor) y no a la tienda ni a la intranet. */
  readonly esProveedor = computed(() => this._sesion()?.roles.includes('PROVEEDOR') ?? false);
  /** Empleado con acceso a al menos un módulo de la intranet. */
  readonly accesoIntranet = computed(() => this.puede('inventario') || this.puede('compras'));
  /** Primer nombre para saludar en la cabecera. */
  readonly primerNombre = computed(
    () => this._sesion()?.nombreCompleto.trim().split(/\s+/)[0] ?? '',
  );

  /** ¿Es empleado y su cargo le da acceso al módulo? (el backend vuelve a validarlo en cada petición). */
  puede(modulo: ModuloIntranet): boolean {
    const sesion = this._sesion();
    return !!sesion && sesion.roles.includes('EMPLEADO') && sesion[modulo] === true;
  }

  /** Los reportes se muestran si el cargo tiene ventas, inventario o compras asignados. */
  puedeVerReportes(): boolean {
    const cargo = (this._sesion()?.cargo ?? '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    const puedeVentas = ['ADMIN', 'ADMINISTRADOR', 'JEFE_VENTAS', 'JEFE_DE_VENTAS'].includes(cargo);
    return puedeVentas || this.puede('inventario') || this.puede('compras');
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        username,
        password,
      })
      .pipe(tap((r) => this.guardar(r)));
  }

  /** Crea la cuenta y deja la sesión iniciada (el backend responde igual que el login). */
  registrar(datos: RegistroCliente): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/registro`, datos)
      .pipe(tap((r) => this.guardar(r)));
  }

  /** Pide el enlace para restablecer la contraseña. El backend responde igual exista o no el correo. */
  olvideClave(correo: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/olvide-clave`, {
      correo,
    });
  }

  /** Cambia la contraseña con el token del enlace del correo (un solo uso, vence a los ~30 min). */
  restablecerClave(token: string, nuevaClave: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/restablecer-clave`, {
      token,
      nuevaClave,
    });
  }

  /** Cambio de contraseña con la sesión iniciada (pide la clave actual). */
  cambiarClave(claveActual: string, nuevaClave: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/cambiar-clave`, {
      claveActual,
      nuevaClave,
    });
  }

  cerrarSesion(): void {
    this._sesion.set(null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // Sin almacenamiento: la sesión solo vivía en memoria.
    }
  }

  private guardar(r: LoginResponse): void {
    const sesion: Sesion = {
      token: r.token,
      username: r.username,
      nombreCompleto: r.nombreCompleto,
      correo: r.correo,
      roles: r.roles,
      permisos: r.permisos,
      cargo: r.cargo,
      inventario: r.inventario,
      compras: r.compras,
      expiraEn: Date.now() + r.expiraEnSegundos * 1000,
    };
    this._sesion.set(sesion);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento: la sesión dura mientras la página esté abierta.
    }
  }

  private leer(): Sesion | null {
    try {
      const datos = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
      // Una sesión de empleado guardada con el formato anterior (sin los módulos) se descarta: pide ingresar de nuevo.
      const completa = !datos?.roles.includes('EMPLEADO') || typeof datos.inventario === 'boolean';
      if (datos && completa && typeof datos.token === 'string' && datos.expiraEn > Date.now()) {
        return datos;
      }
      sessionStorage.removeItem(CLAVE);
    } catch {
      // Datos dañados o sin almacenamiento: se empieza sin sesión.
    }
    return null;
  }
}
