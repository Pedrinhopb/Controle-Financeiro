// ================= página de Configurações =================
document.getElementById('btnSaveConfig').addEventListener('click', async ()=>{
  const d = parseFloat(document.getElementById('cfgDizimo').value);
  const i = parseFloat(document.getElementById('cfgInvest').value);
  if(!isNaN(d)) config.dizimoPct = d;
  if(!isNaN(i)) config.investPct = i;
  await persistConfig();
  updateConfigLabels();
  renderDashboard();
  renderLancamentosView();
});
function updateConfigLabels(){
  document.getElementById('lblDizimoCard').textContent = 'Dízimo (' + config.dizimoPct + '%)';
  document.getElementById('lblInvestCard').textContent = 'Investimento (' + config.investPct + '%)';
}

// listas editáveis (Pessoas, Bancos, Categorias) — cada uma com chips + campo de adicionar
const LISTA_UI = [
  { key:'pessoas',     listEl:'listPessoas',     inputEl:'addPessoa',     btnEl:'btnAddPessoa' },
  { key:'bancos',      listEl:'listBancos',      inputEl:'addBanco',      btnEl:'btnAddBanco' },
  { key:'catReceita',  listEl:'listCatReceita',  inputEl:'addCatReceita', btnEl:'btnAddCatReceita' },
  { key:'catDespFixa', listEl:'listCatDespFixa', inputEl:'addCatDespFixa',btnEl:'btnAddCatDespFixa' },
  { key:'catDespVar',  listEl:'listCatDespVar',  inputEl:'addCatDespVar', btnEl:'btnAddCatDespVar' },
];
function renderConfigView(){
  document.getElementById('cfgDizimo').value = config.dizimoPct;
  document.getElementById('cfgInvest').value = config.investPct;
  LISTA_UI.forEach(cfg=> renderChipList(cfg));
  renderOrcamentoConfig();
}
function normalizeListaItem(value, maxLen = 80){
  const texto = sanitizeTextInput(value, maxLen);
  return texto ? texto : '';
}
function todasCategoriasDespesa(){
  return [...new Set([...listas.catDespFixa, ...listas.catDespVar])].sort((a,b)=>a.localeCompare(b));
}
function renderOrcamentoConfig(){
  const wrap = document.getElementById('orcamentoConfigWrap');
  wrap.innerHTML = '';
  todasCategoriasDespesa().forEach(cat=>{
    const row = document.createElement('div');
    row.className = 'budget-input-row';
    row.innerHTML = '<span class="cat">'+esc(cat)+'</span><input type="number" min="0" step="10" placeholder="R$ / mês" value="'+(orcamentos[cat]||'')+'">';
    const input = row.querySelector('input');
    input.addEventListener('change', async ()=>{
      const v = parseFloat(input.value);
      if(!isNaN(v) && v>0) orcamentos[cat] = v; else delete orcamentos[cat];
      await persistConfig();
      renderDashboard();
      toast('Orçamento atualizado');
    });
    wrap.appendChild(row);
  });
}
function renderOrcamentoAcompanhamento(){
  const hoje = new Date();
  const mes = hoje.getMonth()+1, ano = hoje.getFullYear();
  document.getElementById('orcMesLabel').textContent = '— '+MESES[mes-1]+'/'+ano;
  const cats = Object.keys(orcamentos);
  const wrap = document.getElementById('orcamentoWrap');
  wrap.innerHTML = '';
  document.getElementById('orcamentoEmpty').style.display = cats.length ? 'none' : 'block';
  cats.forEach(cat=>{
    const gasto = dados.filter(d=> d.mes===mes && d.ano===ano && d.categoria===cat && d.tipo!=='Receita').reduce((s,d)=>s+d.valor,0);
    const orcado = orcamentos[cat];
    const pct = orcado>0 ? (gasto/orcado*100) : 0;
    const cls = pct>=100 ? 'over' : (pct>=80 ? 'warn' : 'ok');
    const row = document.createElement('div');
    row.className = 'budget-row';
    row.innerHTML = '<div class="top"><span class="name">'+esc(cat)+'</span><span class="amt">'+fmtMoney(gasto)+' de '+fmtMoney(orcado)+'</span></div>'+
      '<div class="barbg"><div class="barfg '+cls+'" style="width:'+Math.min(100,pct)+'%;"></div></div>';
    wrap.appendChild(row);
  });
}
function renderChipList(cfg){
  const container = document.getElementById(cfg.listEl);
  container.innerHTML = '';
  listas[cfg.key].forEach((item, idx)=>{
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.title = 'Clique para editar';
    chip.innerHTML = esc(item) + ' <button class="x" aria-label="Remover">✕</button>';
    chip.addEventListener('click', async (ev)=>{
      if(ev.target && ev.target.closest('.x')) return;
      const editado = prompt('Editar item:', item);
      if(editado == null) return;
      const novoValor = normalizeListaItem(editado, 80);
      if(!novoValor){
        toast('Nome inválido para edição.', 'warn');
        return;
      }
      if(listas[cfg.key].some((x, i)=> i !== idx && x.toLowerCase() === novoValor.toLowerCase())){
        toast('Este item já existe na lista.', 'warn');
        return;
      }
      listas[cfg.key][idx] = novoValor;
      await persistConfig();
      renderChipList(cfg);
      populateFormLists();
      toast('Lista atualizada', 'ok');
    });
    chip.querySelector('.x').addEventListener('click', async (ev)=>{
      ev.stopPropagation();
      if(!confirm('Remover "'+item+'"? Lançamentos já salvos com esse valor não são alterados.')) return;
      listas[cfg.key].splice(idx,1);
      await persistConfig();
      renderChipList(cfg);
      populateFormLists();
    });
    container.appendChild(chip);
  });
  if(!listas[cfg.key].length){
    const span = document.createElement('span');
    span.className = 'sub'; span.textContent = 'Nenhum item ainda.';
    container.appendChild(span);
  }
}
LISTA_UI.forEach(cfg=>{
  document.getElementById(cfg.btnEl).addEventListener('click', async ()=>{
    const input = document.getElementById(cfg.inputEl);
    const val = normalizeListaItem(input.value, 80);
    if(!val){
      input.value = '';
      toast('Digite um nome válido antes de adicionar.', 'warn');
      return;
    }
    if(listas[cfg.key].some(x=> x.toLowerCase()===val.toLowerCase())){
      input.value = '';
      toast('Este item já existe na lista.', 'warn');
      return;
    }
    listas[cfg.key].push(val);
    input.value = '';
    await persistConfig();
    renderChipList(cfg);
    populateFormLists();
    toast('Item adicionado', 'ok');
  });
  document.getElementById(cfg.inputEl).addEventListener('keydown', (ev)=>{
    if(ev.key==='Enter'){ ev.preventDefault(); document.getElementById(cfg.btnEl).click(); }
  });
});

