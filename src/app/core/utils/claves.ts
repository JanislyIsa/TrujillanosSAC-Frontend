import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/** Reglas de la contraseña nueva (las mismas del backend: de 8 a 72 caracteres). */
export const validadoresClave: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(72),
];

/** Validador de grupo: los dos campos de contraseña deben ser iguales. */
export function clavesIguales(clave: string, confirmar: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null =>
    grupo.get(clave)?.value === grupo.get(confirmar)?.value ? null : { clavesDistintas: true };
}

/** Mensaje de error de una contraseña (solo después de tocarla), o null si está bien. */
export function mensajeClave(control: AbstractControl): string | null {
  if (!control.touched && !control.dirty) return null;
  const e = control.errors ?? {};
  if (e['required']) return 'Este campo es obligatorio.';
  if (e['minlength']) return 'Debe tener al menos 8 caracteres.';
  if (e['maxlength']) return 'Debe tener como máximo 72 caracteres.';
  return null;
}
