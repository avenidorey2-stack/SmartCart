const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(value: number): string {
  // Avoid "-$0.00" from floating-point noise.
  return currency.format(Math.abs(value) < 0.005 ? 0 : value);
}

/** Round to cents so repeated additions don't drift. */
export function cents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** "POTATO CHIPS" -> "Potato chips" */
export function sentenceCase(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Parse user-typed money ("2.99", "$2,99") into a number, or null. */
export function parseMoney(input: string): number | null {
  const n = Number(input.replace(/[$\s]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? cents(n) : null;
}
