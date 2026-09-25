let catSelecionada = null;
let editandoId = null;
let estadoAntesDaExclusao = null;
let orcamentos = {}; // { categoria: valor mensal orçado }
let dividaEtiquetaAtual = 'Todas';

function safeGetStorage(key, fallback = null){
  try{
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  }catch(_e){
    return fallback;
  }
}
function safeSetStorage(key, value){
  try{ localStorage.setItem(key, value); return true; }
  catch(_e){ return false; }
}
function safeRemoveStorage(key){
  try{ localStorage.removeItem(key); return true; }
  catch(_e){ return false; }
}
function sanitizeTextInput(value, maxLen = 80){
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLen);
}
function normalizeNumber(value, fallback = 0){
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function aggregateByKey(items, keySelector, valueSelector = (item) => item){
  const map = new Map();
  for (const item of items){
    const key = keySelector(item);
    const value = Number(valueSelector(item)) || 0;
    map.set(key, (map.get(key) || 0) + value);
  }
  return map;
}
function filterByTextSearch(items, query, fieldSelectors){
  const termo = String(query || '').trim().toLowerCase();
  if(!termo) return items;
  return items.filter(item => fieldSelectors.some(selector => {
    const value = selector(item);
    return value != null && String(value).toLowerCase().includes(termo);
  }));
}

function fmtMoney(v){
  return "R$ " + (Math.round(v*100)/100).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function toast(msg, kind, action){
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast' + (kind ? ' '+kind : '');
  t.innerHTML = (kind==='warn' ? '⚠ ' : '✓ ') + esc(msg);
  if(action){
    const button = document.createElement('button');
    button.className = 'toast-action'; button.type = 'button'; button.textContent = action.label;
    button.addEventListener('click', ()=>{ action.handler(); t.remove(); });
    t.appendChild(button);
  }
  wrap.appendChild(t);
  requestAnimationFrame(()=> t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=> t.remove(), 300);
  }, 2600);
}
function guardarEstadoAntesDaExclusao(){
  estadoAntesDaExclusao = JSON.parse(JSON.stringify({dados, dividaData}));
}
async function desfazerUltimaExclusao(){
  if(!estadoAntesDaExclusao) return;
  dados = estadoAntesDaExclusao.dados;
  dividaData = estadoAntesDaExclusao.dividaData;
  estadoAntesDaExclusao = null;
  await salvarNoFirestore();
  renderLancamentosView(); renderDivida(); renderDashboard();
  toast('Exclusão desfeita', 'ok');
}

