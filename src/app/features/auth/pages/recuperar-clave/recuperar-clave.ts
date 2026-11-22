import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { mensajeError } from '../../../../core/utils/https-errors';

@Component({
  selector: 'app-recuperar-clave',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-clave.html',
})
export class RecuperarClave {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Correo al que se pidió el enlace; null mientras no se haya enviado el formulario. */
  protected readonly enviadoA = signal<string | null>(null);

  protected readonly form = this.fb.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
  });

  protected mensajeCorreo(): string | null {
    const control = this.form.controls.correo;
    if (!control.touched && !control.dirty) return null;
    if (control.errors?.['required']) return 'Escribe tu correo.';
    if (control.errors?.['email'])
      return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    return null;
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const correo = this.form.controls.correo.value.trim();
    this.enviando.set(true);
    this.error.set(null);
    this.auth.olvideClave(correo).subscribe({
      next: () => {
        this.enviadoA.set(correo);
        this.enviando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(mensajeError(e));
        this.enviando.set(false);
      },
    });
  }

  protected otroCorreo(): void {
    this.enviadoA.set(null);
    this.form.reset();
  }
}
