import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { clavesIguales, mensajeClave, validadoresClave } from './claves';

describe('validación de contraseñas', () => {
  it('exige un valor entre 8 y 72 caracteres', () => {
    const control = new FormControl('', validadoresClave);
    expect(control.hasError('required')).toBe(true);
    control.setValue('corta');
    expect(control.hasError('minlength')).toBe(true);
    control.setValue('x'.repeat(73));
    expect(control.hasError('maxlength')).toBe(true);
    control.setValue('clave-valida');
    expect(control.valid).toBe(true);
  });

  it('comprueba que ambas claves coincidan', () => {
    const grupo = new FormGroup({ clave: new FormControl('abc'), confirmar: new FormControl('xyz') });
    const validar = clavesIguales('clave', 'confirmar');
    expect(validar(grupo)).toEqual({ clavesDistintas: true });
    grupo.controls.confirmar.setValue('abc');
    expect(validar(grupo)).toBeNull();
  });

  it('solo muestra el mensaje después de interactuar y reconoce sus errores', () => {
    const control = new FormControl('');
    expect(mensajeClave(control)).toBeNull();
    control.markAsTouched();
    control.setErrors({ required: true });
    expect(mensajeClave(control)).toBe('Este campo es obligatorio.');
    control.setErrors({ minlength: true });
    expect(mensajeClave(control)).toBe('Debe tener al menos 8 caracteres.');
    control.setErrors({ maxlength: true });
    expect(mensajeClave(control)).toBe('Debe tener como máximo 72 caracteres.');
  });
});
