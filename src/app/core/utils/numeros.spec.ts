import { describe, expect, it } from 'vitest';
import { redondear } from './numeros';

describe('redondear', () => {
  it('redondea a dos decimales', () => {
    expect(redondear(1.236)).toBe(1.24);
    expect(redondear(8)).toBe(8);
  });
});
