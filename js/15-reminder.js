// ================= lembrete mensal de exportação (backup de segurança) =================
// Ideia: todo início de mês, se o usuário ainda não exportou uma cópia da planilha
// nesse mês, mostramos um aviso lembrando de fazer isso por segurança.
const DIA_LIMITE_LEMBRETE = 7; // lembra até o dia 7 de cada mês, se ainda não exportou
function chaveUltimoExport(){
  return 'cf-ultimo-export-' + (currentUser?.uid || 'anonimo');
}

function registrarExportacaoRealizada(){
  try{ localStorage.setItem(chaveUltimoExport(), new Date().toISOString()); }catch(e){}
  const banner = document.getElementById('lembreteExportBanner');
  if(banner) banner.classList.remove('show');
}

function verificarLembreteExportacao(){
  const banner = document.getElementById('lembreteExportBanner');
  if(!banner) return;
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let ultimo = null;
  try{ ultimo = localStorage.getItem(chaveUltimoExport()); }catch(e){}

  const jaExportouEsteMes = ultimo && (()=>{
    const d = new Date(ultimo);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  })();

  const dentroDaJanela = diaAtual <= DIA_LIMITE_LEMBRETE;

  if(!jaExportouEsteMes && dentroDaJanela && (dados.length || dividaData.length)){
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

document.getElementById('btnLembreteExportarAgora').addEventListener('click', ()=>{
  document.getElementById('btnExport').click();
});
document.getElementById('btnLembreteDispensar').addEventListener('click', ()=>{
  const banner = document.getElementById('lembreteExportBanner');
  if(banner) banner.classList.remove('show');
  // dispensa só até a próxima vez que o app for aberto — não marca como exportado de fato
});
