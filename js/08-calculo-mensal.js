// ================= cálculo mensal =================
function entriesForMonth(mes, ano){
  return dados.filter(d=> Number(d.mes)===Number(mes) && Number(d.ano)===Number(ano));
}
function computeTotals(entries){
  const dizimoPct = config.dizimoPct/100, investPct = config.investPct/100;
  const receita = entries.filter(e=>e.tipo==='Receita').reduce((s,e)=>s+e.valor,0);
  const despFixa = entries.filter(e=>e.tipo==='Despesa Fixa').reduce((s,e)=>s+e.valor,0);
  const despVar = entries.filter(e=>e.tipo==='Despesa Variável').reduce((s,e)=>s+e.valor,0);
  const despesa = despFixa + despVar;
  const dizimo = receita * dizimoPct;
  const aposDizimo = receita - dizimo;
  const invest = aposDizimo * investPct;
  const saldoDisp = receita - dizimo - invest;
  const saldoFinal = saldoDisp - despesa;
  return {receita, despesa, despFixa, despVar, dizimo, invest, saldoDisp, saldoFinal};
}

// Split por pessoa: total de receita e despesa (fixa+variável) de cada pessoa presente no mês.
// Aviso de despesas fixas ainda não pagas no mês selecionado — pra não esquecer nenhuma conta.
// Compara as categorias de despesa fixa cadastradas em Configurações com as que já foram
// lançadas neste mês, e retorna quais ainda faltam (usado como item do Raio-X do mês).
function categoriasFixasFaltando(entries){
  const categoriasConfiguradas = listas.catDespFixa || [];
  const categoriasLancadas = new Set(entries.filter(e=> e.tipo==='Despesa Fixa').map(e=> e.categoria));
  return { faltando: categoriasConfiguradas.filter(cat=> !categoriasLancadas.has(cat)), total: categoriasConfiguradas.length };
}
function renderSplitPessoas(entries, t){
  const porPessoa = {};
  entries.forEach(e=>{
    const nome = e.pessoa || '—';
    if(!porPessoa[nome]) porPessoa[nome] = { receita:0, despesa:0 };
    if(e.tipo==='Receita') porPessoa[nome].receita += e.valor;
    else porPessoa[nome].despesa += e.valor;
  });
  const grid = document.getElementById('splitPessoasGrid');
  const nomes = Object.keys(porPessoa).sort();
  if(!nomes.length){ grid.innerHTML = '<div class="split-pessoas-empty">Nenhum lançamento com pessoa definida neste mês.</div>'; return; }
  // dízimo e investimento são valores únicos do mês, divididos igualmente entre as duas pessoas —
  // por isso aparecem repetidos (mesmo valor) em cada card, não são específicos de cada uma.
  const metadeDizimo = t.dizimo/2, metadeInvest = t.invest/2;
  grid.innerHTML = nomes.map(nome=>{
    const p = porPessoa[nome];
    return '<div class="split-pessoa-card">'+
      '<div class="nome">'+esc(nome)+'</div>'+
      '<div class="linha receita"><span class="lbl">Receita</span><span class="valor">'+fmtMoney(p.receita)+'</span></div>'+
      '<div class="linha despesa"><span class="lbl">Despesas</span><span class="valor">'+fmtMoney(p.despesa)+'</span></div>'+
      '<div class="linha"><span class="lbl">Dízimo (metade)</span><span class="valor">'+fmtMoney(metadeDizimo)+'</span></div>'+
      '<div class="linha"><span class="lbl">Investimento (metade)</span><span class="valor">'+fmtMoney(metadeInvest)+'</span></div>'+
    '</div>';
  }).join('');
}
function renderLancamentosView(){
  const mes = parseInt(document.getElementById('selMes').value,10);
  const ano = parseInt(document.getElementById('selAno').value,10);
  const entries = entriesForMonth(mes, ano);
  const t = computeTotals(entries);
  const mesNome = MESES[mes-1];

  document.getElementById('subtitle').textContent = mesNome + " de " + ano + " · " + entries.length + " lançamento" + (entries.length===1?'':'s');
  document.getElementById('tableTitle').textContent = "Lançamentos de " + mesNome;

  document.getElementById('cardReceita').textContent = fmtMoney(t.receita);
  document.getElementById('cardDespesaFixa').textContent = fmtMoney(t.despFixa);
  document.getElementById('cardDespesaVar').textContent = fmtMoney(t.despVar);
  document.getElementById('cardDizimo').textContent = fmtMoney(t.dizimo);
  document.getElementById('cardInvest').textContent = fmtMoney(t.invest);
  document.getElementById('cardSaldo').textContent = fmtMoney(t.saldoFinal);
  const taxaPoupanca = t.receita > 0 ? Math.round((t.saldoFinal / t.receita) * 100) : null;
  document.getElementById('taxaPoupanca').textContent = 'Taxa de poupança: ' + (taxaPoupanca===null ? '—%' : taxaPoupanca + '%');

  // comparação com o mês anterior
  const mesAnt = mes===1 ? 12 : mes-1;
  const anoAnt = mes===1 ? ano-1 : ano;
  const tAnt = computeTotals(entriesForMonth(mesAnt, anoAnt));
  renderDelta('deltaReceita', t.receita, tAnt.receita, true);
  renderDelta('deltaDespesaFixa', t.despFixa, tAnt.despFixa, false);
  renderDelta('deltaDespesaVar', t.despVar, tAnt.despVar, false);
  renderDelta('deltaSaldo', t.saldoFinal, tAnt.saldoFinal, true);

  // Os gráficos e o raio-X acompanham o mês selecionado na aba Lançamentos.
  const labelMesSelecionado = '— ' + mesNome + '/' + ano;
  document.getElementById('raioXMesLabel').textContent = labelMesSelecionado;
  document.getElementById('donutMesLabel').textContent = labelMesSelecionado;
  renderInsights(mes, ano, entries, t, tAnt);
  renderDonutsDoMes(entries, t);
  renderSplitPessoas(entries, t);

  const tbody = document.getElementById('tbody'); tbody.innerHTML = '';
  const sorted = [...entries].sort((a,b)=> (a.data < b.data ? 1 : -1));
  const termoBusca = (document.getElementById('buscaLancamentos').value||'').trim();
  const filtrados = filterByTextSearch(sorted, termoBusca, [
    e => e.descricao,
    e => e.categoria,
    e => e.pessoa,
    e => String(e.valor).replace('.', ','),
    e => fmtMoney(e.valor)
  ]);
  filtrados.forEach(e=>{
    const tr = document.createElement('tr');
    const tagClass = e.tipo==='Receita'?'receita':(e.tipo==='Despesa Fixa'?'fixa':'variavel');
    const tagLabel = e.tipo==='Receita'?'Receita':(e.tipo==='Despesa Fixa'?'Fixa':'Variável');
    tr.innerHTML = '<td>'+e.data.split('-').reverse().join('/')+'</td><td>'+esc(e.pessoa)+'</td>'+
      '<td><span class="tag '+tagClass+'">'+tagLabel+'</span></td>'+
      '<td>'+esc(e.categoria)+(e.descricao?' · '+esc(e.descricao):'')+'</td><td>'+fmtMoney(e.valor)+'</td>'+
      '<td style="white-space:nowrap;"><button class="edit" data-id="'+e.id+'" aria-label="Editar lançamento">✎</button> '+
      '<button class="del" data-id="'+e.id+'" aria-label="Excluir lançamento">✕</button></td>';
    tbody.appendChild(tr);
  });
  document.getElementById('emptyMsg').style.display = filtrados.length ? 'none' : 'block';
  document.getElementById('emptyMsg').textContent = termoBusca && entries.length
    ? 'Nenhum lançamento encontrado para "'+document.getElementById('buscaLancamentos').value+'".'
    : 'Nenhum lançamento neste mês ainda.';
  tbody.querySelectorAll('.del').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Excluir este lançamento?')) return;
      guardarEstadoAntesDaExclusao();
      dados = dados.filter(d=>d.id !== btn.getAttribute('data-id'));
      await persistLanc(); renderLancamentosView();
      toast('Lançamento excluído', '', {label:'Desfazer', handler:desfazerUltimaExclusao});
    });
  });
  tbody.querySelectorAll('.edit').forEach(btn=>{
    btn.addEventListener('click', ()=> carregarParaEdicao(btn.getAttribute('data-id')));
  });
}
const COR_RECEITA='#16C98D', COR_DESPFIXA='#F14E63', COR_DESPVAR='#F5A623', COR_DIZIMO='#9B6BF0', COR_INVEST='#1FC3D1';
const PALETA_CATEGORIAS = ['#4C7CF0','#F5A623','#9B6BF0','#1FC3D1','#F14E63','#16C98D','#E85D9C','#6C8CFF','#D6841A','#63C7A5','#8894B0','#C74EF1'];

function svgDonut(items, size){
  size = size || 190;
  const stroke = Math.round(size*0.16);
  const r = size/2 - stroke/2 - 2;
  const cx = size/2, cy = size/2;
  const C = 2*Math.PI*r;
  const total = items.reduce((s,i)=>s+i.value,0);
  let acc = 0, circles = '';
  items.forEach(it=>{
    const frac = it.value/total;
    const dash = Math.max(frac*C - (items.length>1?1.5:0), 0);
    circles += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+it.color+'" stroke-width="'+stroke+'" '+
      'stroke-dasharray="'+dash+' '+(C-dash)+'" stroke-dashoffset="'+(-acc)+'" stroke-linecap="round">'+
      '<title>'+esc(it.label)+': '+fmtMoney(it.value)+' ('+Math.round(frac*100)+'%)</title></circle>';
    acc += frac*C;
  });
  return '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'">'+
    '<g transform="rotate(-90 '+cx+' '+cy+')">'+circles+'</g>'+
    '<text x="'+cx+'" y="'+(cy-6)+'" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" style="fill:var(--text-muted)" letter-spacing="0.5">TOTAL</text>'+
    '<text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="700" style="fill:var(--text-primary)">'+fmtMoney(total).replace('R$ ','R$')+'</text>'+
    '</svg>';
}
function renderDonutInto(elId, items){
  const el = document.getElementById(elId);
  const validItems = items.filter(i=> i.value>0);
  if(!validItems.length){ el.innerHTML = '<div class="donut-empty">Sem dados neste mês ainda.</div>'; return; }
  const total = validItems.reduce((s,i)=>s+i.value,0);
  let legend = '<div class="donut-legend">';
  validItems.forEach(i=>{
    const pct = Math.round(i.value/total*100);
    legend += '<div class="donut-legend-row"><span class="sw" style="background:'+i.color+';"></span>'+
      '<span class="nm">'+esc(i.label)+'</span><span class="vl">'+fmtMoney(i.value)+' · '+pct+'%</span></div>';
  });
  legend += '</div>';
  el.innerHTML = svgDonut(validItems, 190) + legend;
}
function renderDonutsDoMes(entries, t){
  // A "Composição do mês" mostra como a receita foi distribuída (saídas + o que sobrou).
  // Antes esse gráfico misturava a Receita junto com as saídas na mesma pizza, o que fazia a
  // fatia da Receita "encolher" visualmente sempre que outra fatia crescia (já que é % de um total
  // que muda). Agora a pizza representa 100% da receita: para onde ela foi (fixa/variável/dízimo/
  // investimento) e quanto sobrou (saldo), então cada fatia só muda quando o próprio valor muda.
  renderDonutInto('donutComposicao', [
    {label:'Despesa Fixa', value: entries.filter(e=>e.tipo==='Despesa Fixa').reduce((s,e)=>s+e.valor,0), color:COR_DESPFIXA},
    {label:'Despesa Variável', value: entries.filter(e=>e.tipo==='Despesa Variável').reduce((s,e)=>s+e.valor,0), color:COR_DESPVAR},
    {label:'Investimento', value:t.invest, color:COR_INVEST},
    {label:'Dízimo', value:t.dizimo, color:COR_DIZIMO},
    {label:'Saldo restante', value: Math.max(t.saldoFinal,0), color:COR_RECEITA},
  ]);
  const porCatFixa = aggregateByKey(entries.filter(e=>e.tipo==='Despesa Fixa'), e=>e.categoria, e=>e.valor);
  renderDonutInto('donutFixas', [...porCatFixa.entries()].sort((a,b)=>b[1]-a[1])
    .map(([cat,val],i)=>({label:cat, value:val, color:PALETA_CATEGORIAS[i%PALETA_CATEGORIAS.length]})));
  const porCatVar = aggregateByKey(entries.filter(e=>e.tipo==='Despesa Variável'), e=>e.categoria, e=>e.valor);
  renderDonutInto('donutVariaveis', [...porCatVar.entries()].sort((a,b)=>b[1]-a[1])
    .map(([cat,val],i)=>({label:cat, value:val, color:PALETA_CATEGORIAS[i%PALETA_CATEGORIAS.length]})));
}
function renderInsights(mes, ano, entries, t, tAnt){
  // badge de saúde financeira
  const badge = document.getElementById('healthBadge');
  let saudeClasse, saudeTexto;
  if(t.receita === 0 && t.despesa === 0){
    saudeClasse = 'warn'; saudeTexto = '⏳ Sem lançamentos ainda';
  } else if(t.saldoFinal < 0){
    saudeClasse = 'bad'; saudeTexto = '🔴 No vermelho este mês';
  } else if(t.receita > 0 && (t.saldoFinal / t.receita) < 0.1){
    saudeClasse = 'warn'; saudeTexto = '🟡 Apertado este mês';
  } else {
    saudeClasse = 'good'; saudeTexto = '🟢 Saudável';
  }
  badge.className = 'health-badge ' + saudeClasse;
  badge.textContent = saudeTexto;

  const insights = [];

  // maior categoria de despesa
  const porCategoria = aggregateByKey(entries.filter(e=>e.tipo!=='Receita'), e=>e.categoria, e=>e.valor);
  const catsOrdenadas = [...porCategoria.entries()].sort((a,b)=>b[1]-a[1]);
  if(catsOrdenadas.length){
    const [maiorCat, maiorVal] = catsOrdenadas[0];
    const pctDoTotal = t.despesa>0 ? Math.round(maiorVal/t.despesa*100) : 0;
    insights.push({ ic:'🏷️', html:'Sua maior despesa este mês foi <b>'+esc(maiorCat)+'</b>: <b>'+fmtMoney(maiorVal)+'</b> ('+pctDoTotal+'% do total gasto).' });
  }

  // despesas fixas cadastradas que ainda não foram lançadas este mês
  const fixasInfo = categoriasFixasFaltando(entries);
  if(fixasInfo.total && fixasInfo.faltando.length){
    insights.push({ ic:'📋', html: '<b>'+fixasInfo.faltando.length+' de '+fixasInfo.total+'</b> despesas fixas ainda não lançadas este mês: <b>'+esc(fixasInfo.faltando.join(', '))+'</b>.' });
  }

  // comparação com mês anterior
  if(tAnt.despesa > 0){
    const diffPct = Math.round(((t.despesa - tAnt.despesa)/tAnt.despesa)*100);
    if(Math.abs(diffPct) >= 5){
      const dir = diffPct>0 ? 'gastou <b>'+diffPct+'% a mais</b>' : 'gastou <b>'+Math.abs(diffPct)+'% a menos</b>';
      insights.push({ ic: diffPct>0?'📈':'📉', html:'Você '+dir+' que no mês passado.' });
    }
  }

  // contas vencidas (considerando todos os lançamentos, não só o mês filtrado)
  const vencidas = dados.filter(d=> d.tipo!=='Receita' && d.pago==='Não' && d.data < todayISO());
  if(vencidas.length){
    const totalVencido = vencidas.reduce((s,d)=>s+d.valor,0);
    insights.push({ ic:'🔔', html:'Você tem <b>'+vencidas.length+' conta(s) vencida(s)</b> somando <b>'+fmtMoney(totalVencido)+'</b> — revise os lançamentos não pagos.' });
  }

  // percentual do saldo guardado
  if(t.receita > 0){
    const pctSaldo = Math.round((t.saldoFinal/t.receita)*100);
    if(t.saldoFinal >= 0){
      insights.push({ ic:'💰', html:'Depois do dízimo, investimento e despesas, sobrou <b>'+pctSaldo+'%</b> da receita como saldo ('+fmtMoney(t.saldoFinal)+').' });
    } else {
      insights.push({ ic:'⚠️', html:'As despesas ficaram <b>'+fmtMoney(Math.abs(t.saldoFinal))+'</b> acima do que entrou este mês.' });
    }
  }

  const wrap = document.getElementById('insightList');
  wrap.innerHTML = '';
  if(!insights.length){
    wrap.innerHTML = '<div class="insight"><span class="ic2">👋</span><span class="txt">Lance suas receitas e despesas do mês para ver os insights aqui.</span></div>';
    return;
  }
  insights.slice(0,5).forEach(i=>{
    const div = document.createElement('div');
    div.className = 'insight';
    div.innerHTML = '<span class="ic2">'+i.ic+'</span><span class="txt">'+i.html+'</span>';
    wrap.appendChild(div);
  });
}
function renderDelta(elId, atual, anterior, upIsGood){
  const el = document.getElementById(elId);
  if(!el) return;
  if(anterior <= 0){ el.innerHTML = ''; return; }
  const pct = ((atual - anterior) / anterior) * 100;
  if(Math.abs(pct) < 0.5){ el.innerHTML = '<span class="delta">= igual ao mês passado</span>'; return; }
  const subiu = pct > 0;
  const favoravel = subiu === upIsGood;
  const seta = subiu ? '▲' : '▼';
  el.innerHTML = '<span class="delta">'+seta+' '+Math.abs(Math.round(pct))+'% vs mês passado</span>';
  el.querySelector('.delta').style.opacity = favoravel ? '1' : '0.85';
}
document.getElementById('fTipo').addEventListener('change', refreshCategorias);
document.getElementById('fPago').addEventListener('change', atualizarDestaquePago);
function atualizarDestaquePago(){
  const el = document.getElementById('fPago');
  const pago = el.value === 'Sim';
  el.style.background = pago ? 'var(--receita-bg, #E7F9F1)' : 'rgba(245,166,35,.12)';
  el.style.fontWeight = '700';
  el.style.color = pago ? 'var(--receita-2)' : 'var(--divida-2)';
  document.getElementById('wrapDataPagamento').classList.toggle('hidden', pago);
}
document.getElementById('fData').addEventListener('change', ()=>{
  // sugere o mês de referência a partir da data, mas o usuário pode sobrescrever depois
  // (útil pra maioria das contas; casos como "energia vence só no mês seguinte" o usuário ajusta manualmente)
  const dataVal = document.getElementById('fData').value;
  if(!dataVal) return;
  const [ano, mes] = dataVal.split('-').map(Number);
  document.getElementById('fMesRef').value = mes;
  document.getElementById('fAnoRef').value = ano;
  atualizarVisibilidadeCompetencia();
});
// A Competência só aparece automaticamente quando a data escolhida cai em um mês/ano diferente
// do atual (ex: lançar hoje uma conta referente ao mês passado). Fora isso, ela fica dentro de
// "Mais opções", já que na maioria dos lançamentos o valor sugerido automaticamente já está certo.
function atualizarVisibilidadeCompetencia(){
  const hoje = new Date();
  const dataVal = document.getElementById('fData').value;
  let difereDoMesAtual = false;
  if(dataVal){
    const [ano, mes] = dataVal.split('-').map(Number);
    difereDoMesAtual = (mes !== hoje.getMonth()+1) || (ano !== hoje.getFullYear());
  }
  const maisOpcoesAberto = !document.getElementById('extraFieldsSection').classList.contains('hidden');
  document.getElementById('wrapMesRef').classList.toggle('hidden', !(difereDoMesAtual || maisOpcoesAberto));
}
document.getElementById('btnMaisOpcoes').addEventListener('click', ()=>{
  const sec = document.getElementById('extraFieldsSection');
  const aberto = sec.classList.toggle('hidden') === false;
  document.getElementById('btnMaisOpcoes').innerHTML = aberto
    ? '− Menos opções'
    : '+ Mais opções <span class="muted">(pessoa, banco, observação)</span>';
  atualizarVisibilidadeCompetencia();
});
document.getElementById('selMes').addEventListener('change', renderLancamentosView);
document.getElementById('selAno').addEventListener('change', renderLancamentosView);
document.getElementById('buscaLancamentos').addEventListener('input', renderLancamentosView);

document.getElementById('form').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const dataVal = document.getElementById('fData').value;
  const valorVal = parseFloat(document.getElementById('fValor').value);
  const errEl = document.getElementById('formErr');
  if(!dataVal || isNaN(valorVal) || valorVal<=0){ errEl.style.display='block'; return; }
  errEl.style.display='none';
  const mes = parseInt(document.getElementById('fMesRef').value, 10);
  const ano = parseInt(document.getElementById('fAnoRef').value, 10);
  const tipoVal = document.getElementById('fTipo').value;
  const pagoVal = document.getElementById('fPago').value;
  const dataPagamentoVal = pagoVal === 'Não' ? document.getElementById('fDataPagamento').value : '';
  const payload = { data:dataVal, mes, ano,
    pessoa:document.getElementById('fPessoa').value, tipo:tipoVal,
    categoria:document.getElementById('fCategoria').value, descricao:document.getElementById('fDescricao').value.trim(),
    valor:valorVal, pago:pagoVal, dataPagamento:dataPagamentoVal, banco:document.getElementById('fBanco').value,
    obs:document.getElementById('fObs').value.trim() };

  if(editandoId){
    const idx = dados.findIndex(d=>d.id===editandoId);
    if(idx>-1) dados[idx] = { ...dados[idx], ...payload };
    await persistLanc();
    toast('Lançamento atualizado');
    sairModoEdicao();
  } else {
    dados.push({ id:'e'+Date.now()+Math.random().toString(36).slice(2,7), ...payload });
    await persistLanc();
    toast('Lançamento salvo');
  }
  document.getElementById('fDescricao').value=''; document.getElementById('fValor').value=''; document.getElementById('fObs').value='';
  document.getElementById('fDataPagamento').value='';
  document.getElementById('fPago').value = 'Sim';
  atualizarDestaquePago();
  document.getElementById('extraFieldsSection').classList.add('hidden');
  document.getElementById('btnMaisOpcoes').innerHTML = '+ Mais opções <span class="muted">(pessoa, banco, observação)</span>';
  atualizarVisibilidadeCompetencia();
  document.getElementById('selMes').value = mes; document.getElementById('selAno').value = ano;
  renderLancamentosView();
});

function carregarParaEdicao(id){
  const e = dados.find(d=>d.id===id);
  if(!e) return;
  editandoId = id;
  document.getElementById('fData').value = e.data;
  document.getElementById('fMesRef').value = e.mes;
  document.getElementById('fAnoRef').value = e.ano;
  document.getElementById('fPessoa').value = e.pessoa;
  document.getElementById('fTipo').value = e.tipo;
  refreshCategorias();
  document.getElementById('fCategoria').value = e.categoria;
  document.getElementById('fDescricao').value = e.descricao||'';
  document.getElementById('fValor').value = e.valor;
  document.getElementById('fPago').value = e.pago;
  atualizarDestaquePago();
  document.getElementById('fDataPagamento').value = e.dataPagamento||'';
  document.getElementById('fBanco').value = e.banco||'';
  document.getElementById('fObs').value = e.obs||'';
  // ao editar, abre "Mais opções" de cara — o usuário precisa ver o que já estava preenchido
  document.getElementById('extraFieldsSection').classList.remove('hidden');
  document.getElementById('btnMaisOpcoes').innerHTML = '− Menos opções';
  atualizarVisibilidadeCompetencia();
  document.getElementById('formTitle').textContent = 'Editando lançamento';
  document.getElementById('btnSalvarLanc').textContent = 'Salvar edição';
  document.getElementById('btnCancelarEdicao').classList.remove('hidden');
  document.getElementById('fData').scrollIntoView({behavior:'smooth', block:'center'});
}
function sairModoEdicao(){
  editandoId = null;
  document.getElementById('formTitle').textContent = 'Novo lançamento';
  document.getElementById('btnSalvarLanc').textContent = 'Salvar lançamento';
  document.getElementById('btnCancelarEdicao').classList.add('hidden');
}
document.getElementById('btnCancelarEdicao').addEventListener('click', ()=>{
  sairModoEdicao();
  document.getElementById('form').reset();
  const hoje = new Date();
  document.getElementById('fData').value = hoje.toISOString().slice(0,10);
  document.getElementById('fMesRef').value = hoje.getMonth()+1;
  document.getElementById('fAnoRef').value = hoje.getFullYear();
  document.getElementById('extraFieldsSection').classList.add('hidden');
  document.getElementById('btnMaisOpcoes').innerHTML = '+ Mais opções <span class="muted">(pessoa, banco, observação)</span>';
  atualizarVisibilidadeCompetencia();
  refreshCategorias();
});

