// ================= setup selects =================
function populateSelectors(){
  const selMes = document.getElementById('selMes'), selAno = document.getElementById('selAno');
  const selAnoAnual = document.getElementById('selAnoAnual'), catAnoFiltro = document.getElementById('catAnoFiltro');
  const fMesRef = document.getElementById('fMesRef'), fAnoRef = document.getElementById('fAnoRef');
  MESES.forEach((m,i)=>{
    const o=document.createElement('option'); o.value=i+1; o.textContent=m; selMes.appendChild(o);
    const o2=document.createElement('option'); o2.value=i+1; o2.textContent=m; fMesRef.appendChild(o2);
  });
  const anoAtual = new Date().getFullYear();
  for(let a=anoAtual-1; a<=anoAtual+3; a++){
    [selAno, selAnoAnual, catAnoFiltro, fAnoRef].forEach(sel=>{
      const o=document.createElement('option'); o.value=a; o.textContent=a; sel.appendChild(o);
    });
  }
  const hoje = new Date();
  selMes.value = hoje.getMonth()+1;
  selAno.value = hoje.getFullYear();
  selAnoAnual.value = hoje.getFullYear();
  catAnoFiltro.value = hoje.getFullYear();
  fMesRef.value = hoje.getMonth()+1;
  fAnoRef.value = hoje.getFullYear();
}
function populateFormLists(){
  const fBanco = document.getElementById('fBanco'); fBanco.innerHTML = '';
  listas.bancos.forEach(b=>{ const o=document.createElement('option'); o.value=b; o.textContent=b; fBanco.appendChild(o); });
  const fPessoa = document.getElementById('fPessoa'); fPessoa.innerHTML = '';
  listas.pessoas.forEach(p=>{ const o=document.createElement('option'); o.value=p; o.textContent=p; fPessoa.appendChild(o); });
  refreshCategorias();
}
function catsForTipo(tipo){
  if(tipo==='Receita') return listas.catReceita;
  if(tipo==='Despesa Fixa') return listas.catDespFixa;
  return listas.catDespVar;
}
function refreshCategorias(){
  const tipo = document.getElementById('fTipo').value;
  const fCat = document.getElementById('fCategoria'); fCat.innerHTML = '';
  catsForTipo(tipo).forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; fCat.appendChild(o); });
  document.getElementById('lblData').textContent = 'Data';
  document.getElementById('wrapDataPagamento').classList.toggle('hidden', document.getElementById('fPago').value !== 'Não');
}

