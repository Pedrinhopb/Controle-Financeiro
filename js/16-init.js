// ================= init =================
async function init(){
  let temaSalvo = 'light';
  try{ temaSalvo = localStorage.getItem('cf-tema') || 'light'; }catch(e){}
  aplicarTema(temaSalvo);
  populateSelectors();
  populateFormLists();
  updateConfigLabels();
  document.getElementById('fData').value = new Date().toISOString().slice(0,10);
  document.getElementById('dData').value = new Date().toISOString().slice(0,10);
  renderLancamentosView();
  renderDivida();
  switchView('dashboard');
}
init();
