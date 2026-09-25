const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_ABR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const DEFAULTS = {
  pessoas: ["Pedro","Maria"],
  bancos: ["Itaú Pedro","PicPay Pedro","Inter Pedro","Nubank Pedro","Caixa Pedro","Itaú Maria","Nubank Maria","Caixa Maria","Outro"],
  catReceita: ["Salário","Extra","Rendimentos","Outras Receitas"],
  catDespFixa: ["Condomínio","Água","Gás","Internet","Energia","Rastreador","Licenciamento","IPTU","Conta Pedro","Reserva Casa","Outros"],
  catDespVar: ["Açougue","Açaí","Cabelo Pedro","Sobrancelha Maria","Pag Pedro Pai","Lazer Maria","Ifood","Restaurante","Mercado","Padaria","Outros"]
};
// listas mutáveis — usuário adiciona/remove itens em Configurações, e ficam salvas no arquivo Excel
let listas = JSON.parse(JSON.stringify(DEFAULTS));

let dados = [];
let dividaData = [];
let config = { dizimoPct: 5, investPct: 10 };
let dividaConfig = { dataAlvo: '', pagamentoMinimo: 0, jurosMensal: 0 };

globalThis.appState = {};
Object.defineProperties(globalThis.appState, {
  dados: { get: () => dados, set: (value) => { dados = value; } },
  dividaData: { get: () => dividaData, set: (value) => { dividaData = value; } },
  config: { get: () => config, set: (value) => { config = value; } },
  listas: { get: () => listas, set: (value) => { listas = value; } },
  orcamentos: { get: () => orcamentos, set: (value) => { orcamentos = value; } },
  dividaConfig: { get: () => dividaConfig, set: (value) => { dividaConfig = value; } },
  meses: { get: () => MESES }
});

