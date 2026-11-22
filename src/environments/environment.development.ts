export const environment = {
  production: false,
  /** API REST del backend (Spring Boot, perfil dev, puerto 8080). Sin proxy: el backend resuelve el origen con CORS. */
  apiUrl: 'http://localhost:8080/api/v1',
  /** Origen del backend: las imágenes (/img/..., /uploads/...) las sirve Spring, no Angular. */
  backendUrl: 'http://localhost:8080',
  nombreComercio: 'El Trujillano',
  moneda: 'PEN',
  /**
   * Culqi Checkout. La llave PÚBLICA (pk_test_… o pk_live_…, del CulqiPanel > Desarrollo > API Keys) se puede
   * versionar; la secreta (sk_…) nunca va aquí: vive solo en el backend (CULQI_LLAVE_SECRETA).
   */
  culqiPublicKey: 'pk_test_NCp1LDOi6JLka8hc',
  culqiScriptUrl: 'https://checkout.culqi.com/js/v4',
};
