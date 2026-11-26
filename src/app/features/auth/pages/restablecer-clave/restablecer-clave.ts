import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { clavesIguales, mensajeClave, validadoresClave } from '../../../../core/utils/claves';
import { mensajeError } from '../../../../core/utils/https-errors';

@Component({
  selector: 'app-restablecer-clave',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer-clave.html',
})
export class RestablecerClave {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Token del enlace del correo (?token=), enlazado con withComponentInputBinding. */
  readonly token = input<string>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);

  protected readonly form = this.fb.group(
    {
      nuevaClave: ['', validadoresClave],
      confirmar: ['', Validators.required],
    },
    { validators: clavesIguales('nuevaClave', 'confirmar') },
  );

  protected mensaje(campo: 'nuevaClave' | 'confirmar'): string | null {
    const control = this.form.controls[campo];
    if (campo === 'nuevaClave') return mensajeClave(control);
    if (!control.touched && !control.dirty) return null;
    if (control.errors?.['required']) return 'Repite la contraseña.';
    return this.form.errors?.['clavesDistintas'] ? 'Las contraseñas no coinciden.' : null;
  }

  protected restablecer(): void {
    const token = this.token();
    if (!token) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.restablecerClave(token, this.form.controls.nuevaClave.value).subscribe({
      next: () => void this.router.navigate(['/login'], { queryParams: { aviso: 'actualizada' } }),
      error: (e: HttpErrorResponse) => {
        this.error.set(mensajeError(e));
        this.enviando.set(false);
      },
    });
  }
}
