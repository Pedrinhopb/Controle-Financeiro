// ================= Firebase (auth + banco de dados) =================
const firebaseConfig = {
  apiKey: "AIzaSyCAQGA1kp_GAYIIDZODwCzw9zLU6psL1IU",
  authDomain: "controlefinanceiro-5c8a1.firebaseapp.com",
  projectId: "controlefinanceiro-5c8a1",
  storageBucket: "controlefinanceiro-5c8a1.firebasestorage.app",
  messagingSenderId: "1086106048819",
  appId: "1:1086106048819:web:5643147987615a7ef74646"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
Object.defineProperty(globalThis.appState, 'currentUser', {
  configurable: true,
  get: () => currentUser,
  set: (value) => { currentUser = value; }
});
const CHAVE_SYNC_PENDENTE = 'cf-sync-pendente-';

// Todos os dados do usuário (lançamentos, dívida, config, listas, orçamentos) ficam num único
// documento no Firestore — simples de ler/escrever de uma vez, e mais do que suficiente de espaço
// para o volume de dados de um controle financeiro pessoal.
function docPrincipal(){
  return db.collection('usuarios').doc(currentUser.uid).collection('dados').doc('principal');
}
async function salvarNoFirestore(){
  if(!currentUser) return;
  const chave = CHAVE_SYNC_PENDENTE + currentUser.uid;
  if(!navigator.onLine){
    safeSetStorage(chave, '1');
    setSyncStatus('err', 'offline — alterações pendentes');
    return;
  }
  try{
    await docPrincipal().set({
      dados: Array.isArray(dados) ? dados : [],
      dividaData: Array.isArray(dividaData) ? dividaData : [],
      config: config || { dizimoPct:5, investPct:10 },
      listas: listas || JSON.parse(JSON.stringify(DEFAULTS)),
      orcamentos: orcamentos || {},
      dividaConfig: dividaConfig || { dataAlvo:'', pagamentoMinimo:0, jurosMensal:0 },
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    safeRemoveStorage(chave);
    setSyncStatus('ok', 'salvo na nuvem · ' + (Array.isArray(dados) ? dados.length : 0) + ' lançamento(s)');
  }catch(e){
    safeSetStorage(chave, '1');
    console.error('Erro ao salvar no Firestore', e);
    setSyncStatus('err', 'erro ao salvar — tentativa pendente');
  }
}
async function sincronizarAlteracoesPendentes(){
  if(!currentUser || !navigator.onLine) return;
  const pendente = safeGetStorage(CHAVE_SYNC_PENDENTE + currentUser.uid) === '1';
  if(pendente) await salvarNoFirestore();
}
window.addEventListener('online', sincronizarAlteracoesPendentes);
async function carregarDoFirestore(){
  const snap = await docPrincipal().get();
  if(snap.exists){
    const d = snap.data();
    dados = d.dados || [];
    dividaData = d.dividaData || [];
    config = d.config || { dizimoPct:5, investPct:10 };
    listas = d.listas || JSON.parse(JSON.stringify(DEFAULTS));
    orcamentos = d.orcamentos || {};
    dividaConfig = d.dividaConfig || { dataAlvo:'', pagamentoMinimo:0, jurosMensal:0 };
  } else {
    dados = []; dividaData = []; config = { dizimoPct:5, investPct:10 };
    dividaConfig = { dataAlvo:'', pagamentoMinimo:0, jurosMensal:0 };
    listas = JSON.parse(JSON.stringify(DEFAULTS)); orcamentos = {};
  }
}
