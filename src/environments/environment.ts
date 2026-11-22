export const environment = {
  production: true,
  /** Ruta relativa: en producción el backend (o un servidor web delante) atiende /api en el mismo dominio. */
  apiUrl: '/api/v1',
  /** Vacío = mismo dominio. Si el backend queda en otro dominio, pon aquí su origen (https://…) y en apiUrl la URL completa. */
  backendUrl: '',
  nombreComercio: 'El Trujillano',
  moneda: 'PEN',
  /** Llave pública de Culqi. Al salir a producción real cámbiala por la pk_live_… (la secreta va solo en el backend). */
  culqiPublicKey: 'pk_test_NCp1LDOi6JLka8hc',
  culqiScriptUrl: 'https://checkout.culqi.com/js/v4',
};
