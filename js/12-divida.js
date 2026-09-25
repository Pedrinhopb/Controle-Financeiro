// ================= DÍVIDA =================
function dividaFiltrada(){
  if(dividaEtiquetaAtual==='Todas') return dividaData;
  return dividaData.filter(d=> (d.etiqueta||'Sem etiqueta') === dividaEtiquetaAtual);
}
function computeDividaTotal(list){
  const l = list || dividaFiltrada();
  const compras = l.filter(d=>d.tipo==='Compra').reduce((s,d)=>s+d.valor,0);
  const pagamentos = l.filter(d=>d.tipo==='Pagamento').reduce((s,d)=>s+d.valor,0);
  return compras - pagamentos;
}
function computeDividaPorEtiqueta(){
  const grupos = {};
  dividaData.forEach(d=>{
    const key = d.etiqueta || 'Sem etiqueta';
    if(!grupos[key]) grupos[key] = 0;
    grupos[key] += (d.tipo==='Compra' ? d.valor : -d.valor);
  });
  return Object.entries(grupos).map(([etiqueta,saldo])=>({etiqueta,saldo})).sort((a,b)=> b.saldo-a.saldo);
}
function computeDividaResumoMensal(){
  const grupos = {};
  dividaFiltrada().forEach(d=>{
    const [ano, mes] = d.data.split('-').map(Number);
    const key = ano + '-' + String(mes).padStart(2,'0');
    if(!grupos[key]) grupos[key] = {ano, mes, compras:0, pagamento:0};
    if(d.tipo==='Compra') grupos[key].compras += d.valor; else grupos[key].pagamento += d.valor;
  });
  const chaves = Object.keys(grupos).sort();
  let acumulado = 0;
  return chaves.map(k=>{
    const g = grupos[k]; const saldoMes = g.compras - g.pagamento; acumulado += saldoMes;
    return { label: MESES[g.mes-1]+'/'+g.ano, compras:g.compras, pagamento:g.pagamento, saldoMes, acumulado };
  });
}
function computeProjecaoQuitacao(){
  const dividaAtual = computeDividaTotal();
  if(dividaAtual <= 0) return { texto:'Dívida quitada 🎉', detalhe:'Você não tem nenhum valor pendente registrado.' };

  // média de pagamentos dos últimos 3 meses com registro (ignora meses sem nenhum pagamento)
  const porMes = {};
  dividaFiltrada().filter(d=>d.tipo==='Pagamento').forEach(d=>{
    const key = d.data.slice(0,7);
    porMes[key] = (porMes[key]||0) + d.valor;
  });
  const chaves = Object.keys(porMes).sort().slice(-3);
  if(!chaves.length) return { texto:'Sem histórico de pagamento ainda', detalhe:'Registre ao menos um pagamento para calcularmos uma estimativa.' };

  const mediaMensal = chaves.reduce((s,k)=>s+porMes[k],0) / chaves.length;
  if(mediaMensal <= 0) return { texto:'Sem histórico de pagamento ainda', detalhe:'Registre ao menos um pagamento para calcularmos uma estimativa.' };

  const mesesRestantes = Math.ceil(dividaAtual / mediaMensal);
  const hoje = new Date();
  const dataFinal = new Date(hoje.getFullYear(), hoje.getMonth()+mesesRestantes, 1);
  const texto = mesesRestantes<=1 ? '~1 mês (até '+MESES[dataFinal.getMonth()]+'/'+dataFinal.getFullYear()+')'
    : '~'+mesesRestantes+' meses (até '+MESES[dataFinal.getMonth()]+'/'+dataFinal.getFullYear()+')';
  const detalhe = 'Baseado na média dos últimos '+chaves.length+' mês(es) com pagamento registrado: '+fmtMoney(mediaMensal)+'/mês. '+
    'Se você pagar mais que isso, a dívida some mais rápido do que a estimativa.';
  return { texto, detalhe };
}
function mesesParaQuitar(saldoInicial, pagamento, jurosMensal){
  if(saldoInicial <= 0) return 0;
  const taxa = Math.max(0, jurosMensal) / 100;
  if(pagamento <= saldoInicial * taxa) return null;
  let saldo = saldoInicial, meses = 0;
  while(saldo > 0 && meses < 240){
    saldo = saldo * (1 + taxa) - pagamento;
    meses++;
  }
  return saldo <= 0 ? meses : null;
}
function mediaPagamentosRecentes(){
  const porMes = {};
  dividaFiltrada().filter(d=>d.tipo==='Pagamento').forEach(d=>{ porMes[d.data.slice(0,7)] = (porMes[d.data.slice(0,7)]||0) + d.valor; });
  const chaves = Object.keys(porMes).sort().slice(-3);
  return chaves.length ? chaves.reduce((s,k)=>s+porMes[k],0) / chaves.length : 0;
}
function renderPlanejamentoDivida(){
  const saldo = Math.max(computeDividaTotal(), 0);
  const mediaAtual = mediaPagamentosRecentes();
  const minimo = Number(dividaConfig.pagamentoMinimo) || 0;
  const atual = mediaAtual || minimo;
  const maior = Math.max(atual * 1.5, minimo * 1.5, 1);
  const cenarioMinimo = minimo || atual;
  const cenarios = [
    {nome:'Pagamento mínimo', valor:cenarioMinimo, classe:'minimum'},
    {nome:'Ritmo atual', valor:atual, classe:'current'},
    {nome:'Pagamento acelerado', valor:maior, classe:'fast'}
  ];
  document.getElementById('dDataAlvo').value = dividaConfig.dataAlvo || '';
  document.getElementById('dPagamentoMinimo').value = minimo || '';
  document.getElementById('dJurosMensal').value = Number(dividaConfig.jurosMensal) || '';
  const wrap = document.getElementById('dividaCenarios');
  wrap.innerHTML = cenarios.map(c=>{
    const meses = c.valor > 0 ? mesesParaQuitar(saldo, c.valor, Number(dividaConfig.jurosMensal)||0) : null;
    const texto = saldo<=0 ? 'Quitada' : (meses===null ? 'Pagamento insuficiente' : (meses<=1 ? '1 mês' : meses+' meses'));
    return '<div class="debt-scenario '+c.classe+'"><span class="name">'+c.nome+'</span><strong>'+texto+'</strong><small>'+fmtMoney(c.valor)+'/mês</small></div>';
  }).join('');
  const chart = document.getElementById('dividaProjecaoGrafico');
  if(saldo<=0 || atual<=0){ chart.innerHTML = '<div class="empty">Registre pagamentos ou defina um valor mensal para visualizar a redução.</div>'; return; }
  const taxa = (Number(dividaConfig.jurosMensal)||0) / 100;
  let saldoProjetado = saldo, barras = '';
  for(let mes=1; mes<=Math.min(12, mesesParaQuitar(saldo, atual, Number(dividaConfig.jurosMensal)||0) || 12); mes++){
    saldoProjetado = Math.max(0, saldoProjetado * (1 + taxa) - atual);
    barras += '<div class="debt-chart-row"><span>Mês '+mes+'</span><div class="barbg"><div class="barfg" style="width:'+Math.max(2,saldoProjetado/saldo*100)+'%;"></div></div><strong>'+fmtMoney(saldoProjetado)+'</strong></div>';
    if(saldoProjetado<=0) break;
  }
  const metaTexto = dividaConfig.dataAlvo ? ' · meta em '+dividaConfig.dataAlvo.split('-').reverse().join('/') : '';
  chart.innerHTML = '<div class="debt-chart-title">Saldo estimado no ritmo atual'+metaTexto+'</div>'+barras;
}
function renderDivida(){
  // popula o filtro de etiquetas com base nos dados existentes
  const etiquetasPresentes = [...new Set(dividaData.map(d=> d.etiqueta || 'Sem etiqueta'))].sort();
  const selFiltro = document.getElementById('dividaEtiquetaFiltro');
  const valorAtualFiltro = selFiltro.value || 'Todas';
  selFiltro.innerHTML = '<option value="Todas">Todas as etiquetas</option>' +
    etiquetasPresentes.map(e=>'<option value="'+esc(e)+'">'+esc(e)+'</option>').join('');
  selFiltro.value = etiquetasPresentes.includes(valorAtualFiltro) || valorAtualFiltro==='Todas' ? valorAtualFiltro : 'Todas';
  dividaEtiquetaAtual = selFiltro.value;

  // datalist para sugestão de etiqueta no formulário
  document.getElementById('dEtiquetaList').innerHTML = etiquetasPresentes.filter(e=>e!=='Sem etiqueta').map(e=>'<option value="'+esc(e)+'">').join('');

  document.getElementById('lblDividaAtual').textContent = dividaEtiquetaAtual==='Todas' ? 'Dívida atual' : 'Dívida — '+dividaEtiquetaAtual;
  document.getElementById('cardDividaAtual').textContent = fmtMoney(computeDividaTotal());
  const proj = computeProjecaoQuitacao();
  document.getElementById('cardProjecao').textContent = proj.texto;
  document.getElementById('painelProjecao').style.display = proj.detalhe ? 'block' : 'none';
  document.getElementById('projecaoDetalhe').textContent = proj.detalhe;
  renderPlanejamentoDivida();

  // saldo por etiqueta
  const porEtiqueta = computeDividaPorEtiqueta();
  const wrapEtq = document.getElementById('dividaPorEtiqueta');
  wrapEtq.innerHTML = '';
  document.getElementById('dividaEtiquetaEmpty').style.display = (porEtiqueta.length<=1 && porEtiqueta[0] && porEtiqueta[0].etiqueta==='Sem etiqueta') || !porEtiqueta.length ? 'block' : 'none';
  const maxAbs = Math.max(1, ...porEtiqueta.map(p=>Math.abs(p.saldo)));
  porEtiqueta.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = '<div class="name">'+esc(p.etiqueta)+'</div>'+
      '<div class="barbg"><div class="barfg" style="width:'+Math.max(4,Math.abs(p.saldo)/maxAbs*100)+'%;'+(p.saldo<0?'background:linear-gradient(90deg,var(--receita-1),var(--receita-2));':'')+'"></div></div>'+
      '<div class="amt">'+fmtMoney(p.saldo)+'</div>';
    row.addEventListener('click', ()=>{ selFiltro.value = p.etiqueta; dividaEtiquetaAtual = p.etiqueta; renderDivida(); });
    wrapEtq.appendChild(row);
  });

  const tbody = document.getElementById('tbodyDivida'); tbody.innerHTML = '';
  const sorted = [...dividaFiltrada()].sort((a,b)=> a.data<b.data?1:-1);
  const termoBuscaDivida = (document.getElementById('buscaDivida').value||'').trim().toLowerCase();
  const linhasFiltradas = termoBuscaDivida ? sorted.filter(d=>{
    const valorStr = String(d.valor).replace('.', ',');
    return (d.descricao||'').toLowerCase().includes(termoBuscaDivida) ||
      (d.tipo||'').toLowerCase().includes(termoBuscaDivida) ||
      (d.etiqueta||'').toLowerCase().includes(termoBuscaDivida) ||
      valorStr.includes(termoBuscaDivida) || fmtMoney(d.valor).toLowerCase().includes(termoBuscaDivida);
  }) : sorted;
  linhasFiltradas.forEach(d=>{
    const tr = document.createElement('tr');
    const tagClass = d.tipo==='Compra'?'compra':'pagamento';
    tr.innerHTML = '<td>'+d.data.split('-').reverse().join('/')+'</td><td><span class="tag '+tagClass+'">'+d.tipo+'</span></td>'+
      '<td>'+(d.etiqueta?esc(d.etiqueta):'<span class="muted">—</span>')+'</td>'+
      '<td>'+esc(d.descricao)+'</td><td>'+fmtMoney(d.valor)+'</td>'+
      '<td><button class="del" data-id="'+d.id+'" aria-label="Excluir registro">✕</button></td>';
    tbody.appendChild(tr);
  });
  document.getElementById('emptyDividaMsg').style.display = linhasFiltradas.length ? 'none' : 'block';
  document.getElementById('emptyDividaMsg').textContent = termoBuscaDivida && sorted.length
    ? 'Nenhum registro encontrado para "'+document.getElementById('buscaDivida').value+'".'
    : 'Nenhum registro ainda.';
  tbody.querySelectorAll('.del').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Excluir este registro?')) return;
      guardarEstadoAntesDaExclusao();
      dividaData = dividaData.filter(d=>d.id !== btn.getAttribute('data-id'));
      await persistDivida(); renderDivida();
      toast('Registro excluído', '', {label:'Desfazer', handler:desfazerUltimaExclusao});
    });
  });
  const tbodyResumo = document.getElementById('tbodyResumoDivida'); tbodyResumo.innerHTML = '';
  const resumo = computeDividaResumoMensal();
  if(!resumo.length){ tbodyResumo.innerHTML = '<tr><td colspan="5" class="empty">Nenhum registro ainda.</td></tr>'; }
  resumo.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>'+r.label+'</td><td>'+fmtMoney(r.compras)+'</td><td>'+fmtMoney(r.pagamento)+'</td><td>'+fmtMoney(r.saldoMes)+'</td><td><strong>'+fmtMoney(r.acumulado)+'</strong></td>';
    tbodyResumo.appendChild(tr);
  });
}
document.getElementById('dividaEtiquetaFiltro').addEventListener('change', renderDivida);
document.getElementById('buscaDivida').addEventListener('input', renderDivida);
document.getElementById('formDivida').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const dataVal = document.getElementById('dData').value;
  const valorVal = parseFloat(document.getElementById('dValor').value);
  const errEl = document.getElementById('dividaErr');
  if(!dataVal || isNaN(valorVal) || valorVal<=0){ errEl.style.display='block'; return; }
  errEl.style.display='none';

  const etiqueta = sanitizeTextInput(document.getElementById('dEtiqueta').value, 40);
  dividaData.push({ id:'d'+Date.now()+Math.random().toString(36).slice(2,7), data:dataVal,
    tipo:document.getElementById('dTipo').value, descricao:sanitizeTextInput(document.getElementById('dDescricao').value, 120), valor:valorVal, etiqueta: etiqueta || '' });
  await persistDivida();
  document.getElementById('dDescricao').value=''; document.getElementById('dValor').value=''; document.getElementById('dEtiqueta').value='';
  renderDivida();
  toast('Registro de dívida salvo');
});
document.getElementById('btnSalvarPlanejamento').addEventListener('click', async ()=>{
  dividaConfig.dataAlvo = document.getElementById('dDataAlvo').value;
  dividaConfig.pagamentoMinimo = Math.max(0, parseFloat(document.getElementById('dPagamentoMinimo').value) || 0);
  dividaConfig.jurosMensal = Math.max(0, parseFloat(document.getElementById('dJurosMensal').value) || 0);
  await persistDivida();
  renderDivida();
  toast('Planejamento da dívida atualizado');
});

