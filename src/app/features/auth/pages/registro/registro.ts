import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { mensajeError } from '../../../../core/utils/https-errors';

/** Longitud de cada tipo de documento (igual que TIPO_DOCUMENTO en la base de datos). */
const DOCUMENTOS = [
  { codigo: 'DNI', nombre: 'DNI', longitud: 8, soloNumeros: true },
  { codigo: 'CE', nombre: 'Carnet de extranjería', longitud: 12, soloNumeros: false },
  { codigo: 'RUC', nombre: 'RUC', longitud: 11, soloNumeros: true },
] as const;

/** El número de documento debe tener la longitud (y los caracteres) que pide su tipo. */
const documentoValido: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const tipo = DOCUMENTOS.find((d) => d.codigo === grupo.get('tipoDocumento')?.value);
  const numero = String(grupo.get('numeroDocumento')?.value ?? '').trim();
  if (!tipo || !numero) return null;
  if (numero.length !== tipo.longitud) return { documentoLongitud: tipo.longitud };
  if (tipo.soloNumeros && !/^\d+$/.test(numero)) return { documentoNumerico: true };
  return null;
};

const clavesIguales: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null =>
  grupo.get('password')?.value === grupo.get('confirmar')?.value ? null : { clavesDistintas: true };

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Pantalla a la que volver tras registrarse (?returnUrl=). */
  readonly returnUrl = input<string>();

  protected readonly documentos = DOCUMENTOS;
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);

  protected readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]{4,20}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmar: ['', Validators.required],
    },
    { validators: [documentoValido, clavesIguales] },
  );

  /** Tipo elegido: sirve para mostrar cuántos caracteres lleva el documento. */
  protected readonly tipo = toSignal(this.form.controls.tipoDocumento.valueChanges.pipe(startWith('DNI')), {
    initialValue: 'DNI',
  });

  protected longitud(): number {
    return DOCUMENTOS.find((d) => d.codigo === this.tipo())?.longitud ?? 8;
  }

  /** Mensaje de error de un campo (solo después de tocarlo), o null si está bien. */
  protected mensaje(campo: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[campo];
    if (!control.touched && !control.dirty) return null;
    const e = control.errors ?? {};
    if (e['required']) return 'Este campo es obligatorio.';
    if (e['email']) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (e['minlength']) return 'Debe tener al menos 8 caracteres.';
    if (e['pattern']) {
      return campo === 'telefono'
        ? 'El teléfono debe tener 9 dígitos.'
        : 'De 4 a 20 caracteres: letras, números, punto, guion o guion bajo.';
    }
    if (campo === 'numeroDocumento') {
      const g = this.form.errors;
      if (g?.['documentoLongitud']) return `Debe tener ${String(g['documentoLongitud'])} caracteres.`;
      if (g?.['documentoNumerico']) return 'Solo debe tener números.';
    }
    if (campo === 'confirmar' && this.form.errors?.['clavesDistintas']) return 'Las contraseñas no coinciden.';
    return null;
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    return this.mensaje(campo) !== null;
  }

  protected registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const { confirmar: _confirmar, ...datos } = this.form.getRawValue();
    this.auth.registrar({ ...datos, correo: datos.correo.trim(), username: datos.username.trim() }).subscribe({
      next: () => void this.router.navigateByUrl(this.destino()),
      error: (e: HttpErrorResponse) => {
        this.error.set(mensajeError(e));
        this.enviando.set(false);
      },
    });
  }

  /** Solo rutas internas: evita redirigir a otro sitio con un returnUrl manipulado. */
  private destino(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/catalogo';
  }
}
