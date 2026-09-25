import { describe, expect, it } from 'vitest';
import { computeTotals, entriesForMonth, FinancialEntry } from '../ts/08-calculo-mensal';
import { computeAnnual, computeBudgetProgress, monthsForPeriod } from '../ts/10-dashboard';

const entries: FinancialEntry[] = [
  { mes: 1, ano: 2027, tipo: 'Receita', valor: 5000, categoria: 'Salário' },
  { mes: 1, ano: 2027, tipo: 'Despesa Fixa', valor: 1000, categoria: 'Internet' },
  { mes: 1, ano: 2027, tipo: 'Despesa Variável', valor: 500, categoria: 'Mercado' },
  { mes: 2, ano: 2027, tipo: 'Receita', valor: 4000, categoria: 'Salário' },
  { mes: 2, ano: 2027, tipo: 'Despesa Variável', valor: 300, categoria: 'Mercado' },
  { mes: 1, ano: 2026, tipo: 'Receita', valor: 9999, categoria: 'Salário' },
];

describe('cálculos mensais', () => {
  it('separa competência por mês e ano', () => {
    expect(entriesForMonth(entries, 1, 2027)).toHaveLength(3);
    expect(entriesForMonth(entries, 1, 2026)).toHaveLength(1);
    expect(entriesForMonth(entries, 1, 2025)).toHaveLength(0);
  });

  it('calcula dízimo, investimento e saldo final', () => {
    const totals = computeTotals(entriesForMonth(entries, 1, 2027), 5, 10);
    expect(totals.receita).toBe(5000);
    expect(totals.despesa).toBe(1500);
    expect(totals.dizimo).toBe(250);
    expect(totals.invest).toBe(475);
    expect(totals.saldoFinal).toBe(2775);
  });

  it('não mistura receita com despesas', () => {
    const totals = computeTotals(entriesForMonth(entries, 2, 2027), 5, 10);
    expect(totals.despesa).toBe(300);
    expect(totals.saldoFinal).toBe(3120);
  });
});

describe('orçamento por categoria', () => {
  it('normaliza categoria e ignora receitas', () => {
    const result = computeBudgetProgress(entries, ' mercado ', 400, 2);
    expect(result.realizado).toBe(800);
    expect(result.previsto).toBe(800);
    expect(result.percentual).toBe(100);
    expect(result.status).toBe('over');
  });

  it('classifica alerta a partir de 80%', () => {
    const result = computeBudgetProgress(entries, 'Internet', 700, 1);
    expect(result.percentual).toBeCloseTo(142.857, 2);
    expect(result.status).toBe('over');
  });
});

describe('cálculo anual e regressões', () => {
  it('mantém ano no recorte e acumula o saldo mensal', () => {
    const annual = computeAnnual(entries, 2027, 5, 10);
    expect(annual.meses[0].receita).toBe(5000);
    expect(annual.meses[1].receita).toBe(4000);
    expect(annual.totals.receita).toBe(9000);
    expect(annual.meses[1].acumulado).toBe(5895);
  });

  it('aplica trimestre e mês sem alterar os meses de origem', () => {
    const annual = computeAnnual(entries, 2027, 5, 10);
    expect(monthsForPeriod(annual.meses, 'q1')).toHaveLength(3);
    expect(monthsForPeriod(annual.meses, 'm2')[0].nome).toBe('Fevereiro');
    expect(annual.meses).toHaveLength(12);
  });
});
