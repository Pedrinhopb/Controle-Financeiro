import * as XLSX from 'xlsx';

const state = globalThis.appState;
const MESES = state.meses;
const { salvarNoFirestore, populateFormLists, updateConfigLabels, renderLancamentosView,
  renderDivida, switchView, toast, registrarExportacaoRealizada } = globalThis;
// ================= excel export / sync =================
function buildWorkbook(){
  const dizimoFrac = state.config.dizimoPct/100, investFrac = state.config.investPct/100;
  const wb = XLSX.utils.book_new();

  const head = ["Data","Pessoa","Mês","Ano","Tipo","Categoria","Descrição","Valor","Pago","Data Pagamento","Banco","Observação"];
  const rows = [...state.dados].sort((a,b)=> a.data<b.data?-1:1).map(e=>[
    e.data.split('-').reverse().join('/'), e.pessoa, MESES[e.mes-1], e.ano, e.tipo, e.categoria, e.descricao, e.valor, e.pago,
    e.dataPagamento ? e.dataPagamento.split('-').reverse().join('/') : '', e.banco, e.obs
  ]);
  const wsLanc = XLSX.utils.aoa_to_sheet([head, ...rows]);
  wsLanc['!cols'] = [{wch:11},{wch:9},{wch:12},{wch:7},{wch:16},{wch:18},{wch:24},{wch:12},{wch:7},{wch:13},{wch:16},{wch:22}];
  for(let r=0;r<rows.length;r++){ const c=wsLanc[XLSX.utils.encode_cell({r:r+1,c:7})]; if(c) c.z='R$ #,##0.00'; }
  XLSX.utils.book_append_sheet(wb, wsLanc, "Lançamentos");

  const anos = [...new Set(state.dados.map(d=>d.ano))].sort();
  const anoRef = anos[anos.length-1] || new Date().getFullYear();
  const resumoHead = ["Mês","Receita","Despesas","Dízimo","Investimento","Saldo Final"];
  const resumoRows = MESES.map(m=>[m,0,0,0,0,0]);
  const wsResumo = XLSX.utils.aoa_to_sheet([["Ano de referência:", anoRef], ["Dízimo %:", dizimoFrac], ["Investimento %:", investFrac], [], resumoHead, ...resumoRows]);
  const startRow = 6;
  for(let i=0;i<12;i++){
    const r = startRow+i, mesNome = MESES[i];
    wsResumo[XLSX.utils.encode_cell({r:r-1,c:1})] = {t:'n', f:'SUMIFS(Lançamentos!$H:$H,Lançamentos!$E:$E,"Receita",Lançamentos!$C:$C,"'+mesNome+'",Lançamentos!$D:$D,$B$1)', z:'R$ #,##0.00'};
    wsResumo[XLSX.utils.encode_cell({r:r-1,c:2})] = {t:'n', f:'SUMIFS(Lançamentos!$H:$H,Lançamentos!$E:$E,"Despesa Fixa",Lançamentos!$C:$C,"'+mesNome+'",Lançamentos!$D:$D,$B$1)+SUMIFS(Lançamentos!$H:$H,Lançamentos!$E:$E,"Despesa Variável",Lançamentos!$C:$C,"'+mesNome+'",Lançamentos!$D:$D,$B$1)', z:'R$ #,##0.00'};
    wsResumo[XLSX.utils.encode_cell({r:r-1,c:3})] = {t:'n', f:'B'+r+'*$B$2', z:'R$ #,##0.00'};
    wsResumo[XLSX.utils.encode_cell({r:r-1,c:4})] = {t:'n', f:'(B'+r+'-D'+r+')*$B$3', z:'R$ #,##0.00'};
    wsResumo[XLSX.utils.encode_cell({r:r-1,c:5})] = {t:'n', f:'B'+r+'-D'+r+'-E'+r+'-C'+r, z:'R$ #,##0.00'};
  }
  wsResumo['!cols'] = [{wch:14},{wch:13},{wch:13},{wch:12},{wch:14},{wch:13}];
  wsResumo['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:startRow+10, c:5}});
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  const dHead = ["Data","Mês","Ano","Tipo","Descrição","Valor"];
  const dRows = [...state.dividaData].sort((a,b)=> a.data<b.data?-1:1).map(d=>{
    const [ano, mes] = d.data.split('-').map(Number);
    return [d.data.split('-').reverse().join('/'), MESES[mes-1], ano, d.tipo, d.descricao, d.valor];
  });
  const wsDivida = XLSX.utils.aoa_to_sheet([dHead, ...dRows]);
  wsDivida['!cols'] = [{wch:11},{wch:12},{wch:7},{wch:12},{wch:26},{wch:12}];
  for(let r=0;r<dRows.length;r++){ const c=wsDivida[XLSX.utils.encode_cell({r:r+1,c:5})]; if(c) c.z='R$ #,##0.00'; }
  XLSX.utils.book_append_sheet(wb, wsDivida, "Dívida");

  const anosDivida = [...new Set(state.dividaData.map(d=> Number(d.data.split('-')[0])))].sort();
  const anoRefDivida = anosDivida[anosDivida.length-1] || new Date().getFullYear();
  const rdHead = ["Mês","Compras","Pagamento","Saldo do Mês","Saldo Acumulado"];
  const rdRows = MESES.map(m=>[m,0,0,0,0]);
  const wsResumoDivida = XLSX.utils.aoa_to_sheet([["Ano de referência:", anoRefDivida], [], rdHead, ...rdRows]);
  const rdStart = 4;
  for(let i=0;i<12;i++){
    const r = rdStart+i, mesNome = MESES[i];
    wsResumoDivida[XLSX.utils.encode_cell({r:r-1,c:1})] = {t:'n', f:'SUMIFS(Dívida!$F:$F,Dívida!$D:$D,"Compra",Dívida!$B:$B,"'+mesNome+'",Dívida!$C:$C,$B$1)', z:'R$ #,##0.00'};
    wsResumoDivida[XLSX.utils.encode_cell({r:r-1,c:2})] = {t:'n', f:'SUMIFS(Dívida!$F:$F,Dívida!$D:$D,"Pagamento",Dívida!$B:$B,"'+mesNome+'",Dívida!$C:$C,$B$1)', z:'R$ #,##0.00'};
    wsResumoDivida[XLSX.utils.encode_cell({r:r-1,c:3})] = {t:'n', f:'B'+r+'-C'+r, z:'R$ #,##0.00'};
    const prevRef = i===0 ? '0' : 'E'+(r-1);
    wsResumoDivida[XLSX.utils.encode_cell({r:r-1,c:4})] = {t:'n', f:prevRef+'+D'+r, z:'R$ #,##0.00'};
  }
  wsResumoDivida['!cols'] = [{wch:12},{wch:13},{wch:13},{wch:13},{wch:15}];
  wsResumoDivida['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:rdStart+10, c:4}});
  XLSX.utils.book_append_sheet(wb, wsResumoDivida, "Resumo Dívida");

  // Configurações — listas editáveis (Pessoas, Bancos, Categorias)
  const cfgHead = ["Pessoas","Bancos","Categorias Receita","Categorias Desp. Fixa","Categorias Desp. Variável"];
  const cfgCols = [state.listas.pessoas, state.listas.bancos, state.listas.catReceita, state.listas.catDespFixa, state.listas.catDespVar];
  const maxLen = Math.max(...cfgCols.map(c=>c.length), 0);
  const cfgRows = [];
  for(let i=0;i<maxLen;i++){ cfgRows.push(cfgCols.map(c=> c[i] || '')); }
  const wsCfg = XLSX.utils.aoa_to_sheet([cfgHead, ...cfgRows]);
  wsCfg['!cols'] = [{wch:16},{wch:18},{wch:20},{wch:20},{wch:22}];
  XLSX.utils.book_append_sheet(wb, wsCfg, "Configurações");

  // Orçamentos — orçamento mensal por categoria (opcional)
  const orcRows = Object.entries(state.orcamentos).map(([cat,val])=>[cat, val]);
  const wsOrc = XLSX.utils.aoa_to_sheet([["Categoria","Orçamento Mensal"], ...orcRows]);
  wsOrc['!cols'] = [{wch:22},{wch:16}];
  for(let r=0;r<orcRows.length;r++){ const c=wsOrc[XLSX.utils.encode_cell({r:r+1,c:1})]; if(c) c.z='R$ #,##0.00'; }
  XLSX.utils.book_append_sheet(wb, wsOrc, "Orçamentos");

  return wb;
}

document.getElementById('btnExport').addEventListener('click', ()=>{
  if(!state.dados.length && !state.dividaData.length){ alert('Ainda não há lançamentos para exportar.'); return; }
  XLSX.writeFile(buildWorkbook(), "controle-financeiro.xlsx");
  if(typeof registrarExportacaoRealizada === 'function') registrarExportacaoRealizada();
  toast('Cópia exportada — backup em dia! 💾');
});

function setSyncStatus(state, label){
  const dot = document.getElementById('syncDot');
  dot.classList.remove('ok','err');
  if(state==='ok') dot.classList.add('ok');
  if(state==='err') dot.classList.add('err');
  document.getElementById('syncText').textContent = label;
  const headerDot = document.getElementById('headerSyncDot');
  if(headerDot){
    headerDot.classList.remove('ok','err');
    if(state==='ok') headerDot.classList.add('ok');
    if(state==='err') headerDot.classList.add('err');
  }
  const headerText = document.getElementById('headerSyncText');
  if(headerText) headerText.textContent = label;
  const banner = document.getElementById('syncBanner');
  if(state==='err'){
    document.getElementById('syncBannerText').textContent = label;
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}
// Importa uma planilha exportada anteriormente pelo app (ex: seu Excel antigo, sincronizado
// localmente) e envia esses dados para o Firestore, substituindo o que estiver na conta atual.
document.getElementById('btnImportar').addEventListener('click', ()=>{
  document.getElementById('inputImportar').click();
});
document.getElementById('inputImportar').addEventListener('change', async (ev)=>{
  const file = ev.target.files[0];
  ev.target.value = '';
  if(!file) return;
  if(!state.currentUser){ alert('Faça login antes de importar.'); return; }
  try{
    const buf = await file.arrayBuffer();
    if(!buf.byteLength) throw new Error('A planilha está vazia.');
    const wb = XLSX.read(buf, {type:'array', cellDates:false});
    const nomesAbas = wb.SheetNames || [];
    const abasConhecidas = ['Lançamentos','Dívida','Resumo','Configurações','Orçamentos'];
    const temEstruturaDoApp = abasConhecidas.some(nome=>nomesAbas.includes(nome));
    if(!temEstruturaDoApp){
      throw new Error('Esta planilha não possui as abas esperadas do Controle Financeiro. Use uma planilha criada/exportada pelo aplicativo.');
    }
    if(state.dados.length || state.dividaData.length){
      if(!confirm('Importar essa planilha vai substituir os '+state.dados.length+' lançamento(s) já salvos na sua conta. Continuar?')) return;
      const agora = new Date().toISOString().replace(/[:.]/g,'-');
      XLSX.writeFile(buildWorkbook(), 'backup-antes-da-importacao-'+agora+'.xlsx');
      toast('Backup automático criado antes da importação', 'ok');
    }
    const state = parseWorkbookIntoState(wb);
    globalThis.appState.dados = state.dados;
    globalThis.appState.dividaData = state.dividaData;
    globalThis.appState.config = state.config;
    globalThis.appState.listas = state.listas;
    globalThis.appState.orcamentos = state.orcamentos;

    await salvarNoFirestore();
    populateFormLists();
    updateConfigLabels();
    renderLancamentosView();
    renderDivida();
    switchView('dashboard');
    toast('Planilha importada: ' + state.dados.length + ' lançamento(s)');
  }catch(e){
    console.error('Erro ao importar planilha:', e);
    alert(e.message || 'Não foi possível importar essa planilha.');
  }
});

