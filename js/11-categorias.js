// ================= CATEGORIAS =================
function computeCategoryTotals(ano, tipoFiltro){
  const filtered = dados.filter(d=> d.ano===ano && d.tipo!=='Receita' && (tipoFiltro==='Todas' || d.tipo===tipoFiltro));
  const grupos = {};
  filtered.forEach(d=>{
    if(!grupos[d.categoria]) grupos[d.categoria] = 0;
    grupos[d.categoria] += d.valor;
  });
  return Object.entries(grupos).map(([categoria, total])=>({categoria, total})).sort((a,b)=> b.total-a.total);
}
function renderCategorias(){
  const ano = parseInt(document.getElementById('catAnoFiltro').value,10);
  const tipoFiltro = document.getElementById('catTipoFiltro').value;
  const ranking = computeCategoryTotals(ano, tipoFiltro);
  const wrap = document.getElementById('catRanking');
  wrap.innerHTML = '';
  document.getElementById('catEmpty').style.display = ranking.length ? 'none' : 'block';
  const max = ranking.length ? ranking[0].total : 1;
  ranking.forEach(r=>{
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = '<div class="name">'+esc(r.categoria)+'</div>'+
      '<div class="barbg"><div class="barfg" style="width:'+Math.max(4,(r.total/max*100))+'%;"></div></div>'+
      '<div class="amt">'+fmtMoney(r.total)+'</div>';
    row.addEventListener('click', ()=> selecionarCategoria(r.categoria, ano, tipoFiltro));
    wrap.appendChild(row);
  });
  if(catSelecionada) selecionarCategoria(catSelecionada, ano, tipoFiltro);
}
function selecionarCategoria(categoria, ano, tipoFiltro){
  catSelecionada = categoria;
  document.getElementById('catDetailTitle').innerHTML = 'Lançamentos — <span style="color:var(--despesa-2)">'+esc(categoria)+'</span>';
  const items = dados.filter(d=> d.ano===ano && d.categoria===categoria && d.tipo!=='Receita' && (tipoFiltro==='Todas'||d.tipo===tipoFiltro))
    .sort((a,b)=> a.data<b.data?1:-1);
  const tbody = document.getElementById('catDetailBody'); tbody.innerHTML = '';
  items.forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>'+e.data.split('-').reverse().join('/')+'</td><td>'+esc(e.pessoa)+'</td><td>'+esc(e.descricao||'—')+'</td><td>'+fmtMoney(e.valor)+'</td>';
    tbody.appendChild(tr);
  });
  document.getElementById('catDetailEmpty').style.display = items.length ? 'none' : 'block';
}
document.getElementById('catTipoFiltro').addEventListener('change', renderCategorias);
document.getElementById('catAnoFiltro').addEventListener('change', renderCategorias);

