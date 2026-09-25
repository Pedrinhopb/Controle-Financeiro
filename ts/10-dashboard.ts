import { computeTotals, entriesForMonth, FinancialEntry, MonthlyTotals } from './08-calculo-mensal';

export interface AnnualMonth extends MonthlyTotals {
  nome: string;
  ano: number;
  acumulado: number;
}

export interface AnnualSummary {
  meses: AnnualMonth[];
  totals: Omit<MonthlyTotals, 'despFixa' | 'despVar' | 'saldoDisp'>;
}

const DEFAULT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function computeAnnual(
  entries: readonly FinancialEntry[],
  ano: number,
  dizimoPct: number,
  investPct: number,
  monthNames = DEFAULT_MONTHS,
): AnnualSummary {
  const meses = monthNames.map((nome, index) => ({
    nome,
    ano,
    ...computeTotals(entriesForMonth(entries, index + 1, ano), dizimoPct, investPct),
    acumulado: 0,
  }));

  const totals = meses.reduce((acc, month) => ({
    receita: acc.receita + month.receita,
    despesa: acc.despesa + month.despesa,
    dizimo: acc.dizimo + month.dizimo,
    invest: acc.invest + month.invest,
    saldoFinal: acc.saldoFinal + month.saldoFinal,
  }), { receita: 0, despesa: 0, dizimo: 0, invest: 0, saldoFinal: 0 });

  let acumulado = 0;
  for (const month of meses) {
    acumulado += month.saldoFinal;
    month.acumulado = acumulado;
  }
  return { meses, totals };
}

export function monthsForPeriod<T>(months: readonly T[], period: string): T[] {
  if (period === 'ano') return [...months];
  if (period.startsWith('q')) {
    const quarter = Number(period.slice(1)) - 1;
    return months.slice(quarter * 3, quarter * 3 + 3);
  }
  if (period.startsWith('m')) return months.slice(Number(period.slice(1)) - 1, Number(period.slice(1)));
  return [...months];
}

export function sumMonths(months: readonly Pick<MonthlyTotals, 'receita' | 'despesa' | 'dizimo' | 'invest' | 'saldoFinal'>[]) {
  return months.reduce((acc, month) => ({
    receita: acc.receita + month.receita,
    despesa: acc.despesa + month.despesa,
    dizimo: acc.dizimo + month.dizimo,
    invest: acc.invest + month.invest,
    saldoFinal: acc.saldoFinal + month.saldoFinal,
  }), { receita: 0, despesa: 0, dizimo: 0, invest: 0, saldoFinal: 0 });
}

export interface BudgetProgress {
  realizado: number;
  previsto: number;
  percentual: number;
  status: 'ok' | 'warn' | 'over';
}

export function computeBudgetProgress(
  entries: readonly FinancialEntry[],
  categoria: string,
  orcamentoMensal: number,
  quantidadeMeses: number,
): BudgetProgress {
  const categoriaNormalizada = categoria.trim().toLocaleLowerCase();
  const realizado = entries
    .filter((entry) => entry.tipo !== 'Receita')
    .filter((entry) => (entry.categoria ?? '').trim().toLocaleLowerCase() === categoriaNormalizada)
    .reduce((sum, entry) => sum + Number(entry.valor || 0), 0);
  const previsto = Math.max(0, Number(orcamentoMensal || 0)) * Math.max(1, quantidadeMeses);
  const percentual = previsto > 0 ? realizado / previsto * 100 : 0;
  const status = percentual >= 100 ? 'over' : percentual >= 80 ? 'warn' : 'ok';
  return { realizado, previsto, percentual, status };
}
