/** Redondea a 2 decimales (soles y céntimos). */
export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
