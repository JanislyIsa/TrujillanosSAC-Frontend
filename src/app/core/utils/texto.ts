export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** true si todas las palabras de la búsqueda aparecen en alguno de los campos (sin importar tildes ni mayúsculas). */
export function coincide(busqueda: string, ...campos: string[]): boolean {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const texto = normalizar(campos.join(' '));
  return palabras.every((palabra) => texto.includes(palabra));
}
