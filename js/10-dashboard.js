// ================= VISÃO ANUAL =================
function computeAnnual(ano){
  const meses = MESES.map((nome,i)=>{
    const t = computeTotals(entriesForMonth(i+1, ano));
    return { nome, ano, ...t };
  });
  const totals = meses.reduce((acc,m)=>({
    receita:acc.receita+m.receita, despesa:acc.despesa+m.despesa, dizimo:acc.dizimo+m.dizimo,
    invest:acc.invest+m.invest, saldoFinal:acc.saldoFinal+m.saldoFinal
  }), {receita:0,despesa:0,dizimo:0,invest:0,saldoFinal:0});
  let acumulado = 0;
  meses.forEach(m=>{ acumulado += m.saldoFinal; m.acumulado = acumulado; });
  return { meses, totals };
}

function mesesDoPeriodoDashboard(meses, periodo){
  if(periodo === 'ano') return meses;
  if(periodo && periodo.charAt(0) === 'q'){
    const trimestre = Number(periodo.slice(1)) - 1;
    return meses.slice(trimestre * 3, trimestre * 3 + 3);
  }
  if(periodo && periodo.charAt(0) === 'm') return [meses[Number(periodo.slice(1)) - 1]];
  return meses;
}
function totaisDosMeses(meses){
  return meses.reduce((acc,m)=>({
    receita:acc.receita+m.receita, despesa:acc.despesa+m.despesa, dizimo:acc.dizimo+m.dizimo,
    invest:acc.invest+m.invest, saldoFinal:acc.saldoFinal+m.saldoFinal
  }), {receita:0,despesa:0,dizimo:0,invest:0,saldoFinal:0});
}

function rotuloPeriodoDashboard(periodo){
  const select = document.getElementById('selPeriodoDashboard');
  return select?.selectedOptions[0]?.textContent || 'Ano inteiro';
}
function mesNumeroPorNome(nome){ return MESES.indexOf(nome) + 1; }
function entradasDosMeses(meses){
  return meses.flatMap(m=>entriesForMonth(mesNumeroPorNome(m.nome), m.ano));
}
function renderDashboardOrcamento(meses, periodo){
  const wrap = document.getElementById('dashboardBudgetList');
  const empty = document.getElementById('dashboardBudgetEmpty');
  const entries = entradasDosMeses(meses);
  const categorias = Object.keys(orcamentos);
  document.getElementById('dashboardBudgetLabel').textContent = rotuloPeriodoDashboard(periodo).toLowerCase();
  wrap.innerHTML = '';
  empty.style.display = categorias.length ? 'none' : 'block';
  categorias.slice().sort().forEach(cat=>{
    const categoriaNormalizada = String(cat).trim().toLocaleLowerCase();
    const realizado = entries.filter(e=>String(e.categoria || '').trim().toLocaleLowerCase()===categoriaNormalizada &&
      String(e.tipo || '').trim().toLocaleLowerCase()!=='receita').reduce((s,e)=>s+Number(e.valor || 0),0);
    const previsto = orcamentos[cat] * (meses.length || 1);
    const pct = previsto > 0 ? realizado / previsto * 100 : 0;
    const classe = pct >= 100 ? 'over' : (pct >= 80 ? 'warn' : 'ok');
    const row = document.createElement('div'); row.className = 'budget-row';
    row.innerHTML = '<div class="top"><span class="name">'+esc(cat)+'</span><span class="amt">'+fmtMoney(realizado)+' / '+fmtMoney(previsto)+'</span></div>'+ 
      '<div class="barbg"><div class="barfg '+classe+'" style="width:'+Math.min(100,Math.max(2,pct))+'%;"></div></div>'+ 
      '<div class="budget-status '+classe+'">'+(pct >= 100 ? 'Acima do limite' : (pct >= 80 ? 'Atenção: '+Math.round(pct)+'%' : Math.round(pct)+'% utilizado'))+'</div>';
    wrap.appendChild(row);
  });
}
function renderDashboardProjecao(){
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1, anoAtual = hoje.getFullYear();
  const atual = computeTotals(entriesForMonth(mesAtual, anoAtual));
  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const diasPassados = Math.max(1, Math.min(diasNoMes, hoje.getDate()));
  const despesaProjetada = atual.despesa / diasPassados * diasNoMes;
  const saldoProjetado = atual.receita - atual.dizimo - atual.invest - despesaProjetada;
  const historico = [];
  for(let offset=1; offset<=3; offset++){
    const data = new Date(anoAtual, mesAtual - 1 - offset, 1);
    historico.push(computeTotals(entriesForMonth(data.getMonth()+1, data.getFullYear())));
  }
  const mediaDespesas = historico.reduce((s,t)=>s+t.despesa,0) / historico.length;
  const mediaReceitas = historico.reduce((s,t)=>s+t.receita,0) / historico.length;
  document.getElementById('dashSaldoProjetado').textContent = fmtMoney(saldoProjetado);
  document.getElementById('dashMediaDespesas').textContent = fmtMoney(mediaDespesas);
  document.getElementById('dashMediaReceitas').textContent = fmtMoney(mediaReceitas);
  const alert = document.getElementById('dashForecastAlert');
  const tendenciaDespesa = mediaDespesas > 0 && atual.despesa > mediaDespesas * 1.1;
  const tendenciaReceita = mediaReceitas > 0 && atual.receita < mediaReceitas * .9;
  alert.className = 'forecast-alert ' + (saldoProjetado < 0 || tendenciaDespesa || tendenciaReceita ? 'warn' : 'ok');
  alert.textContent = saldoProjetado < 0 ? 'Atenção: o ritmo atual pode fechar o mês no vermelho.' :
    (tendenciaDespesa ? 'As despesas deste mês estão acima da média recente.' :
    (tendenciaReceita ? 'A receita deste mês está abaixo da média recente.' : 'Ritmo financeiro dentro da média recente.'));
}

function svgAnnualChart(meses){
  const W = 900, H = 300, padL = 46, padB = 30, padT = 10, padR = 10;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const maxVal = Math.max(1, ...meses.map(m=> Math.max(m.receita, m.despesa)));
  const maxSaldo = Math.max(1, ...meses.map(m=> Math.abs(m.acumulado)));
  const groupW = chartW / meses.length;
  const barW = groupW * 0.32;

  let bars = '';
  let points = [];
  meses.forEach((m,i)=>{
    const gx = padL + i*groupW;
    const hR = (m.receita/maxVal)*chartH, hD = (m.despesa/maxVal)*chartH;
    const yR = padT + chartH - hR, yD = padT + chartH - hD;
    bars += '<rect x="'+(gx+groupW*0.14)+'" y="'+yR+'" width="'+barW+'" height="'+hR+'" rx="3" fill="url(#gradReceita)"><title>'+m.nome+' — Receita: '+fmtMoney(m.receita)+'</title></rect>';
    bars += '<rect x="'+(gx+groupW*0.52)+'" y="'+yD+'" width="'+barW+'" height="'+hD+'" rx="3" fill="url(#gradDespesa)"><title>'+m.nome+' — Despesa: '+fmtMoney(m.despesa)+'</title></rect>';
    bars += '<text x="'+(gx+groupW/2)+'" y="'+(H-10)+'" font-size="10.5" style="fill:var(--text-secondary)" text-anchor="middle" font-family="Inter">'+MESES_ABR[i]+'</text>';
    const yS = padT + chartH - ((m.acumulado/maxSaldo)*chartH*0.5 + chartH*0.5);
    points.push([gx+groupW/2, Math.max(padT, Math.min(padT+chartH, yS))]);
  });

  let line = 'M ' + points.map(p=>p[0]+' '+p[1]).join(' L ');
  let dots = points.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.2" fill="var(--saldo-1)"/>').join('');

  let gridlines = '';
  for(let i=0;i<=4;i++){
    const y = padT + chartH - (chartH*i/4);
    gridlines += '<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" style="stroke:var(--border)" stroke-width="1"/>';
    gridlines += '<text x="'+(padL-8)+'" y="'+(y+3)+'" font-size="9.5" style="fill:var(--text-muted)" text-anchor="end" font-family="Inter">'+fmtMoney(maxVal*i/4).replace('R$ ','')+'</text>';
  }

  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;">'+
    '<defs>'+
      '<linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#16C98D"/><stop offset="100%" stop-color="#0E9E6C"/></linearGradient>'+
      '<linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F14E63"/><stop offset="100%" stop-color="#D22F44"/></linearGradient>'+
    '</defs>'+
    gridlines + bars +
    '<path d="'+line+'" fill="none" stroke="var(--saldo-1)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>'+ 
    dots +
    '</svg>';
}

function svgBiMonthlyChart(meses){
  const W=900,H=250,pL=48,pR=18,pT=18,pB=42;
  const plotW=W-pL-pR, plotH=H-pT-pB;
  const max=Math.max(...meses.map(m=>Math.max(m.receita,m.despesa,Math.abs(m.saldoFinal))),1);
  const min=Math.min(...meses.map(m=>Math.min(0,m.saldoFinal)));
  const range=Math.max(max-min,1);
  const y=v=>pT+(max-v)/range*plotH;
  const step=plotW/meses.length, bw=Math.min(22,step*.27);
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Comportamento mensal de receita, despesa e saldo">';
  s+='<line x1="'+pL+'" y1="'+y(0)+'" x2="'+(W-pR)+'" y2="'+y(0)+'" style="stroke:var(--border)" stroke-width="1"/>';
  meses.forEach((m,i)=>{
    const x=pL+i*step+step/2;
    const rh=Math.max(0,y(0)-y(m.receita));
    const dh=Math.max(0,y(0)-y(m.despesa));
    s+='<rect x="'+(x-bw-2)+'" y="'+(y(m.receita))+'" width="'+bw+'" height="'+rh+'" rx="4" fill="var(--receita-1)" opacity=".9"><title>'+m.nome+': Receita '+fmtMoney(m.receita)+'</title></rect>';
    s+='<rect x="'+(x+2)+'" y="'+(y(m.despesa))+'" width="'+bw+'" height="'+dh+'" rx="4" fill="var(--despesa-1)" opacity=".9"><title>'+m.nome+': Despesa '+fmtMoney(m.despesa)+'</title></rect>';
    const sy=y(m.saldoFinal);
    s+='<circle cx="'+x+'" cy="'+sy+'" r="4" fill="var(--saldo-1)"><title>'+m.nome+': Saldo '+fmtMoney(m.saldoFinal)+'</title></circle>';
    if(i<meses.length-1){ const nx=pL+(i+1)*step+step/2; const ns=y(meses[i+1].saldoFinal); s+='<line x1="'+x+'" y1="'+sy+'" x2="'+nx+'" y2="'+ns+'" stroke="var(--saldo-1)" stroke-width="2.5" stroke-linecap="round"/>'; }
    s+='<text x="'+x+'" y="'+(H-16)+'" text-anchor="middle" font-size="10" fill="var(--text-secondary)">'+MESES_ABR[i]+'</text>';
  });
  s+='<text x="'+pL+'" y="'+(pT+2)+'" font-size="9.5" fill="var(--text-muted)">'+fmtMoney(max)+'</text>';
  s+='</svg>';
  return s;
}
function renderDashboardInsights(ano, meses, totals){
  const comp=[
    {label:'Despesa',value:totals.despesa,color:COR_DESPFIXA},
    {label:'Investimento',value:totals.invest,color:COR_INVEST},
    {label:'Dízimo',value:totals.dizimo,color:COR_DIZIMO},
    {label:'Saldo',value:Math.max(totals.saldoFinal,0),color:COR_RECEITA}
  ];
  renderDonutInto('biComposicaoAnual',comp);
  const investRate=totals.receita?totals.invest/totals.receita*100:0;
  const saldoRate=totals.receita?totals.saldoFinal/totals.receita*100:0;
  document.getElementById('biInvestRate').textContent=investRate.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  document.getElementById('biSaldoRate').textContent=saldoRate.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  const entradasPeriodo = entradasDosMeses(meses);
  const porCategoria = aggregateByKey(entradasPeriodo.filter(e=>e.tipo!=='Receita'), e=>e.categoria, e=>e.valor);
  const cats = [...porCategoria.entries()].map(([categoria,total])=>({categoria,total})).sort((a,b)=>b.total-a.total).slice(0,7);
  const maxCat=cats.length?cats[0].total:1;
  const wrap=document.getElementById('biCategorias'); wrap.innerHTML='';
  if(!cats.length) wrap.innerHTML='<div class="bi-empty">Sem despesas categorizadas neste ano.</div>';
  else cats.forEach(c=>{
    const row=document.createElement('div'); row.className='bar-item';
    row.innerHTML='<div class="top"><span class="name">'+esc(c.categoria)+'</span><span class="amount">'+fmtMoney(c.total)+'</span></div><div class="bg"><div class="fg" style="width:'+Math.max(3,c.total/maxCat*100)+'%"></div></div>';
    wrap.appendChild(row);
  });
  document.getElementById('biMaiorDespesa').textContent=cats.length?esc(cats[0].categoria):'—';
  document.getElementById('biFluxoSub').textContent='— '+ano+' · receita, despesa e saldo por mês';
  document.getElementById('biFluxoMensal').innerHTML=svgBiMonthlyChart(meses);
}
// Bloco de dívida do dashboard — separado de propósito dos gráficos financeiros.
// Usa sempre TODOS os registros de dívida (sem o filtro de etiqueta da aba Dívida).
function renderDashboardDivida(){
  const totalCompras = dividaData.filter(d=>d.tipo==='Compra').reduce((s,d)=>s+d.valor,0);
  const totalPagamentos = dividaData.filter(d=>d.tipo==='Pagamento').reduce((s,d)=>s+d.valor,0);
  const saldoAtual = Math.max(totalCompras - totalPagamentos, 0);
  const pctQuitado = totalCompras>0 ? Math.min(100, Math.round((totalPagamentos/totalCompras)*100)) : 0;

  document.getElementById('dashDividaAtual').textContent = fmtMoney(saldoAtual);
  document.getElementById('dashDividaAbatida').textContent = fmtMoney(totalPagamentos);
  document.getElementById('dashDividaTotalGerado').textContent = fmtMoney(totalCompras);
  document.getElementById('dashDividaBarFg').style.width = pctQuitado + '%';
  document.getElementById('dashDividaPct').textContent = totalCompras>0
    ? pctQuitado + '% já quitado'
    : 'Nenhum registro de dívida ainda';
}
function renderDashboard(){
  const ano = parseInt(document.getElementById('selAnoAnual').value,10);
  const periodo = document.getElementById('selPeriodoDashboard').value;
  const anual = computeAnnual(ano);
  const meses = mesesDoPeriodoDashboard(anual.meses, periodo);
  const totals = totaisDosMeses(meses);
  document.getElementById('subtitleAnual').textContent = rotuloPeriodoDashboard(periodo) + ' de ' + ano;
  document.getElementById('anualChartSub').textContent = '— ' + ano;
  document.getElementById('anReceita').textContent = fmtMoney(totals.receita);
  document.getElementById('anDespesa').textContent = fmtMoney(totals.despesa);
  document.getElementById('anDizimo').textContent = fmtMoney(totals.dizimo);
  document.getElementById('anInvest').textContent = fmtMoney(totals.invest);
  document.getElementById('anSaldo').textContent = fmtMoney(totals.saldoFinal);

  document.getElementById('anualChart').innerHTML = svgAnnualChart(meses);
  renderDashboardInsights(ano, meses, totals);
  renderDashboardOrcamento(meses, periodo);
  renderDashboardProjecao();
  renderDashboardDivida();

  const tbody = document.getElementById('tbodyAnual'); tbody.innerHTML = '';
  meses.forEach(m=>{
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>'+m.nome+'</td><td>'+fmtMoney(m.receita)+'</td><td>'+fmtMoney(m.despesa)+'</td>'+
      '<td>'+fmtMoney(m.dizimo)+'</td><td>'+fmtMoney(m.invest)+'</td><td><strong>'+fmtMoney(m.saldoFinal)+'</strong></td>';
    tbody.appendChild(tr);
  });


}
document.getElementById('selAnoAnual').addEventListener('change', renderDashboard);
document.getElementById('selPeriodoDashboard').addEventListener('change', renderDashboard);

