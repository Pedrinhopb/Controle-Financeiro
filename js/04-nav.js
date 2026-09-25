// ================= NAV =================
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=> switchView(btn.getAttribute('data-view')));
});

const sidebarToggle = document.getElementById('btnSidebarToggle');
const sidebar = document.querySelector('.sidebar');
if(sidebarToggle && sidebar){
  const estadoSalvoSidebar = safeGetStorage('cf-sidebar-expanded') === '1';
  sidebar.classList.toggle('expanded', estadoSalvoSidebar);
  sidebarToggle.setAttribute('aria-expanded', String(estadoSalvoSidebar));
  sidebarToggle.textContent = estadoSalvoSidebar ? '✕' : '☰';

  sidebarToggle.addEventListener('click', ()=>{
    const expandida = sidebar.classList.toggle('expanded');
    sidebarToggle.setAttribute('aria-expanded', String(expandida));
    sidebarToggle.textContent = expandida ? '✕' : '☰';
    safeSetStorage('cf-sidebar-expanded', expandida ? '1' : '0');
  });
}

const headerSearch = document.getElementById('headerSearch');
if(headerSearch){
  const aplicarBuscaGlobal = (termo, forcarView = true)=>{
    const texto = termo.trim();
    if(!texto) return;
    if(forcarView) switchView('lancamentos');
    const busca = document.getElementById('buscaLancamentos');
    if(busca){
      busca.value = texto;
      busca.dispatchEvent(new Event('input', {bubbles:true}));
    }
  };

  headerSearch.addEventListener('input', ()=>{
    const termo = headerSearch.value.trim();
    if(!termo) return;
    aplicarBuscaGlobal(termo, false);
  });

  headerSearch.addEventListener('keydown', ev=>{
    if(ev.key === 'Enter'){
      ev.preventDefault();
      aplicarBuscaGlobal(headerSearch.value, true);
      return;
    }
    if(ev.key === 'Escape'){
      headerSearch.value = '';
      const busca = document.getElementById('buscaLancamentos');
      if(busca){ busca.value = ''; busca.dispatchEvent(new Event('input', {bubbles:true})); }
    }
  });
}
function switchView(view){
  ['dashboard','lancamentos','categorias','divida','config'].forEach(v=>{
    const el = document.getElementById('view'+v.charAt(0).toUpperCase()+v.slice(1));
    if(el) el.classList.toggle('hidden', v!==view);
  });
  document.querySelectorAll('.nav-item').forEach(b=> b.classList.toggle('active', b.getAttribute('data-view')===view));
  if(view==='dashboard') renderDashboard();
  if(view==='lancamentos') renderLancamentosView();

  if(view==='categorias'){ renderCategorias(); renderOrcamentoAcompanhamento(); }
  if(view==='config') renderConfigView();
}

