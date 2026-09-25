// ================= persistência (arquivo é a fonte da verdade) =================
async function persistLanc(){ await salvarNoFirestore(); }
async function persistDivida(){ await salvarNoFirestore(); }
async function persistConfig(){ await salvarNoFirestore(); }

function parseDateCell(v){
  if(v == null || v === '') return null;
  if(typeof v === 'number'){
    const d = XLSX.SSF.parse_date_code(v);
    if(!d) return null;
    return d.y + '-' + String(d.m).padStart(2,'0') + '-' + String(d.d).padStart(2,'0');
  }
  if(typeof v === 'string'){
    const text = v.trim();
    if(text.includes('/')){
      const [dd,mm,yyyy] = text.split('/').map(Number);
      if(!dd||!mm||!yyyy) return null;
      return yyyy + '-' + String(mm).padStart(2,'0') + '-' + String(dd).padStart(2,'0');
    }
    if(/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  }
  return null;
}
function parseNumericCell(v, fallback = 0){
  if(v == null || v === '') return fallback;
  const n = typeof v === 'string' ? Number(v.replace(',', '.').replace(/[^0-9.-]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function parseWorkbookIntoState(wb){
  const newDados = [];
  const wsLanc = wb.Sheets['Lançamentos'];
  if(wsLanc){
    XLSX.utils.sheet_to_json(wsLanc, {header:1}).slice(1).forEach((r, idx)=>{
      if(!Array.isArray(r) || !r[0]) return;
      const iso = parseDateCell(r[0]); if(!iso) return;
      const [yyyy, mm] = iso.split('-').map(Number);
      const dataPagIso = r[9] ? parseDateCell(r[9]) : null;
      newDados.push({ id:'e'+Date.now()+Math.random().toString(36).slice(2,7)+'-'+idx, data:iso, mes:mm, ano:yyyy,
        pessoa:String(r[1] || '').trim(), tipo:String(r[4] || 'Receita').trim() || 'Receita', categoria:String(r[5] || '').trim(), descricao:String(r[6] || '').trim(), valor:parseNumericCell(r[7],0),
        pago:String(r[8] || 'Não').trim() || 'Não', dataPagamento: dataPagIso||'', banco:String(r[10] || '').trim(), obs:String(r[11] || '').trim() });
    });
  }
  const newDivida = [];
  const wsDivida = wb.Sheets['Dívida'];
  if(wsDivida){
    XLSX.utils.sheet_to_json(wsDivida, {header:1}).slice(1).forEach((r, idx)=>{
      if(!Array.isArray(r) || !r[0]) return;
      const iso = parseDateCell(r[0]); if(!iso) return;
      newDivida.push({ id:'d'+Date.now()+Math.random().toString(36).slice(2,7)+'-'+idx, data:iso, tipo:String(r[3] || 'Compra').trim() || 'Compra', descricao:String(r[4] || '').trim(), valor:parseNumericCell(r[5],0) });
    });
  }
  let newConfig = { dizimoPct:5, investPct:10 };
  const wsResumo = wb.Sheets['Resumo'];
  if(wsResumo){
    const dz = wsResumo['B2'] ? Number(wsResumo['B2'].v) : null;
    const inv = wsResumo['B3'] ? Number(wsResumo['B3'].v) : null;
    if(dz != null && !isNaN(dz)) newConfig.dizimoPct = Math.min(100, Math.max(0, Math.round(dz*1000)/10));
    if(inv != null && !isNaN(inv)) newConfig.investPct = Math.min(100, Math.max(0, Math.round(inv*1000)/10));
  }

  let newListas = JSON.parse(JSON.stringify(DEFAULTS));
  const wsCfg = wb.Sheets['Configurações'];
  if(wsCfg){
    const json = XLSX.utils.sheet_to_json(wsCfg, {header:1});
    const cols = { pessoas:0, bancos:1, catReceita:2, catDespFixa:3, catDespVar:4 };
    Object.keys(cols).forEach(key=> newListas[key] = []);
    json.slice(1).forEach(r=>{
      if(!Array.isArray(r)) return;
      Object.entries(cols).forEach(([key, idx])=>{
        const v = r[idx];
        if(v != null && String(v).trim() !== '') newListas[key].push(String(v).trim());
      });
    });
    Object.keys(cols).forEach(key=>{ if(!newListas[key].length) newListas[key] = DEFAULTS[key].slice(); });
  }

  let newOrcamentos = {};
  const wsOrc = wb.Sheets['Orçamentos'];
  if(wsOrc){
    XLSX.utils.sheet_to_json(wsOrc, {header:1}).slice(1).forEach(r=>{
      if(!Array.isArray(r) || !r[0]) return;
      const nome = String(r[0]).trim();
      const v = parseNumericCell(r[1], NaN);
      if(nome && Number.isFinite(v) && v > 0) newOrcamentos[nome] = v;
    });
  }

  return { dados:newDados, dividaData:newDivida, config:newConfig, listas:newListas, orcamentos:newOrcamentos };
}

