export type NumberLike = number | string | null | undefined;

export function normalizeNumber(value: NumberLike, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function sanitizeTextInput(value: unknown, maxLen = 80): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

export function aggregateByKey<T>(
  items: readonly T[],
  keySelector: (item: T) => string,
  valueSelector: (item: T) => NumberLike = (item) => item as unknown as NumberLike,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const item of items) {
    const key = keySelector(item);
    const value = normalizeNumber(valueSelector(item));
    result.set(key, (result.get(key) ?? 0) + value);
  }
  return result;
}

export function filterByTextSearch<T>(
  items: readonly T[],
  query: unknown,
  fieldSelectors: readonly ((item: T) => unknown)[],
): T[] {
  const term = String(query ?? '').trim().toLowerCase();
  if (!term) return [...items];
  return items.filter((item) => fieldSelectors.some((selector) => {
    const value = selector(item);
    return value != null && String(value).toLowerCase().includes(term);
  }));
}

export function formatMoney(value: NumberLike): string {
  return `R$ ${normalizeNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
