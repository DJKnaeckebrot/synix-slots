/** Display currency for virtual balances (no real-money value). */
export function formatEuro(value: number): string {
  return `€${new Intl.NumberFormat("de-DE").format(value)}`;
}
