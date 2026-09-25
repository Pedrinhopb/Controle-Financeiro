import { normalizeNumber } from './03-utils';

export type EntryType = 'Receita' | 'Despesa Fixa' | 'Despesa Variável' | string;

export interface FinancialEntry {
  mes: number;
  ano: number;
  tipo: EntryType;
  valor: number;
  categoria?: string;
}

export interface MonthlyTotals {
  receita: number;
  despesa: number;
  despFixa: number;
  despVar: number;
  dizimo: number;
  invest: number;
  saldoDisp: number;
  saldoFinal: number;
}

export function entriesForMonth(
  entries: readonly FinancialEntry[],
  mes: number,
  ano: number,
): FinancialEntry[] {
  return entries.filter((entry) => Number(entry.mes) === Number(mes) && Number(entry.ano) === Number(ano));
}

export function computeTotals(
  entries: readonly FinancialEntry[],
  dizimoPct: number,
  investPct: number,
): MonthlyTotals {
  const receita = entries.filter((entry) => entry.tipo === 'Receita')
    .reduce((sum, entry) => sum + normalizeNumber(entry.valor), 0);
  const despFixa = entries.filter((entry) => entry.tipo === 'Despesa Fixa')
    .reduce((sum, entry) => sum + normalizeNumber(entry.valor), 0);
  const despVar = entries.filter((entry) => entry.tipo === 'Despesa Variável')
    .reduce((sum, entry) => sum + normalizeNumber(entry.valor), 0);
  const despesa = despFixa + despVar;
  const dizimo = receita * normalizeNumber(dizimoPct) / 100;
  const aposDizimo = receita - dizimo;
  const invest = aposDizimo * normalizeNumber(investPct) / 100;
  const saldoDisp = receita - dizimo - invest;

  return {
    receita,
    despesa,
    despFixa,
    despVar,
    dizimo,
    invest,
    saldoDisp,
    saldoFinal: saldoDisp - despesa,
  };
}
