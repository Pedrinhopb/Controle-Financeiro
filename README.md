# Controle Financeiro — estrutura do projeto

O app foi reorganizado do arquivo único `index.html` (2200+ linhas) para uma
estrutura em pastas, mais fácil de manter. A arquitetura incremental está descrita
em [ARCHITECTURE.md](ARCHITECTURE.md).

```
controle-financeiro/
├── index.html              → só a estrutura (HTML), sem CSS/JS embutido
├── manifest.json           → permite "adicionar à tela inicial" no celular
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── css/
│   ├── foundation/
│   │   └── tokens.css      → cores, tema, tipografia e tokens
│   ├── style.css           → entrada atual dos estilos
│   └── README.md           → convenções de organização visual
└── js/
    ├── 00-state.js          → variáveis globais (meses, listas padrão, dados)
    ├── 01-firebase-config.js→ config do Firebase (mesma de antes)
    ├── 02-auth.js           → login, cadastro e login com Google
    ├── 03-utils.js          → funções auxiliares (formatar dinheiro, toast...)
    ├── 04-nav.js            → menu lateral / troca de telas
    ├── 05-persistencia.js   → salvar/carregar lançamentos
    ├── 06-selects.js        → preencher selects/formulários
    ├── 07-config-page.js    → tela de Configurações
    ├── 08-calculo-mensal.js → cálculos da tela de Lançamentos
    ├── 10-dashboard.js      → tela Dashboard (visão anual)
    ├── 11-categorias.js     → tela Categorias
    ├── 12-divida.js         → tela Dívida
    ├── 13-export-excel.js   → exportar/importar planilha Excel
    ├── 14-tema.js           → tema claro/escuro
    ├── 15-reminder.js       → lembrete mensal de exportação (novo)
    └── 16-init.js           → inicialização do app
```

Os módulos de domínio tipados ficam em `ts/`, e o comando `npm run typecheck`
valida essa camada sem alterar o runtime atual.

Os arquivos JS são carregados na ordem numerada — mantenha essa ordem se
adicionar/mexer em algo, porque alguns arquivos usam funções e variáveis
definidas nos anteriores.

## Desenvolvimento e produção

```bash
npm install
npm run dev
npm run validate
npm run deploy
```

O build é gerado em `dist/`. O deploy exige Firebase CLI autenticado com
`firebase login`; o comando publica Hosting e regras do Firestore.

## O que mudou nesta versão

1. **Lembrete mensal de exportação** (`15-reminder.js`): do dia 1 ao dia 7 de
   cada mês, se você ainda não exportou uma cópia da planilha naquele mês,
   aparece um aviso no topo do app com um botão "Exportar agora". Ele some
   sozinho assim que você exporta (ou clica em "Agora não" para dispensar
   até a próxima vez que abrir o app).

2. **Login com Google + Cadastro** (`02-auth.js` + tela de login): agora dá
   pra entrar com um clique em "Continuar com Google", ou criar uma conta
   nova com e-mail e senha (link "Ainda não tenho conta — criar conta" na
   tela de login). Login com e-mail/senha e "esqueci minha senha" continuam
   funcionando como antes.

   ⚠️ Para o login com Google funcionar, é preciso habilitar o provedor
   **Google** em Firebase Console → Authentication → Sign-in method → Google
   (se ainda não estiver habilitado).

3. **Melhorias no celular**: cards de resumo, formulários e tabelas foram
   ajustados para telas pequenas, e o `manifest.json` + ícones permitem
   "Adicionar à Tela de Início" no celular para abrir o app como se fosse
   nativo.

4. **Arquitetura incremental**: tokens visuais e cálculos centrais começaram a
   ser extraídos para camadas próprias, sem alterar o comportamento publicado.

## Como publicar no Firebase Hosting

Se seu projeto já usa `firebase.json` apontando para essa pasta como
`public`, basta rodar de dentro da pasta do projeto:

```bash
firebase deploy --only hosting
```

Se for a primeira vez configurando o Hosting nesse computador:

```bash
firebase login
firebase init hosting   # aponte "public directory" para esta pasta
firebase deploy --only hosting
```
