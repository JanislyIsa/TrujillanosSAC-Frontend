import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { clavesIguales, mensajeClave, validadoresClave } from '../../../../core/utils/claves';
import { mensajeError } from '../../../../core/utils/https-errors';

/** La contraseña nueva no puede ser la misma que la actual. */
function claveDistinta(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('nuevaClave')?.value;
  return nueva && nueva === grupo.get('claveActual')?.value ? { claveIgual: true } : null;
}

@Component({
  selector: 'app-cuenta',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './cuenta.html',
  styleUrl: './cuenta.css',
})
export class Cuenta {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sesion = this.auth.sesion;

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cambiada = signal(false);
  protected readonly verClave = signal(false);

  protected readonly form = this.fb.group(
    {
      claveActual: ['', Validators.required],
      nuevaClave: ['', validadoresClave],
      confirmar: ['', Validators.required],
    },
    { validators: [clavesIguales('nuevaClave', 'confirmar'), claveDistinta] },
  );

  protected mensaje(campo: 'claveActual' | 'nuevaClave' | 'confirmar'): string | null {
    const control = this.form.controls[campo];
    if (campo === 'nuevaClave') {
      return (
        mensajeClave(control) ??
        (control.dirty && this.form.errors?.['claveIgual']
          ? 'Debe ser distinta a la actual.'
          : null)
      );
    }
    if (!control.touched && !control.dirty) return null;
    if (control.errors?.['required'])
      return campo === 'claveActual' ? 'Escribe tu contraseña actual.' : 'Repite la contraseña.';
    if (campo === 'confirmar' && this.form.errors?.['clavesDistintas'])
      return 'Las contraseñas no coinciden.';
    return null;
  }

  protected cambiarClave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { claveActual, nuevaClave } = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.cambiada.set(false);
    this.auth.cambiarClave(claveActual, nuevaClave).subscribe({
      next: () => {
        this.form.reset();
        this.cambiada.set(true);
        this.enviando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(mensajeError(e));
        this.enviando.set(false);
      },
    });
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/catalogo');
  }
}
