# Controle Financeiro

Aplicação web para organizar a vida financeira pessoal, acompanhar receitas e despesas, controlar dízimo, investimentos, orçamentos e dívidas em um só lugar.

## Acesso

Aplicação publicada no Firebase Hosting: [Acessar o Controle Financeiro](https://controlefinanceiro-5c8a1.web.app/)

Cada usuário entra com sua própria conta e acessa somente os dados vinculados ao seu UID no Firebase.

## Para que serve

O sistema ajuda a responder perguntas práticas do dia a dia:

- Quanto entrou e quanto foi gasto no mês?
- Quanto foi destinado ao dízimo e aos investimentos?
- Qual foi o saldo final?
- Quais categorias estão consumindo mais dinheiro?
- Quanto do orçamento mensal já foi utilizado?
- Como está o ritmo financeiro do mês?
- Qual é o saldo atual das dívidas?

## Funcionalidades

### Dashboard

- Resumo anual de receitas, despesas, dízimo, investimento e saldo.
- Filtro por ano e período: ano inteiro, trimestre ou mês.
- Gráficos de receita, despesa, saldo acumulado e comportamento mensal.
- Composição financeira anual e ranking das maiores despesas.
- Comparação entre orçamento previsto e valor realizado.
- Projeção financeira com base no ritmo atual.
- Médias de receitas e despesas dos últimos três meses.
- Resumo de dívidas separado dos gráficos financeiros.

### Lançamentos

- Cadastro de receitas, despesas fixas e despesas variáveis.
- Data do lançamento e competência mensal.
- Pessoa, banco, categoria, descrição e observações.
- Controle de pagamento e data de pagamento.
- Edição, exclusão e desfazer exclusão recente.
- Busca por descrição, categoria, pessoa ou valor.
- Resumo mensal com indicadores, gráficos e insights automáticos.
- Comparação com o mês anterior.

### Categorias

- Ranking de despesas por categoria.
- Filtro por ano e tipo de despesa.
- Detalhamento dos lançamentos de uma categoria.

### Dívidas

- Registro de compras ou valores gerados e pagamentos.
- Cálculo do saldo devedor e do percentual quitado.
- Organização por etiqueta, busca e filtros.
- Configuração de juros, pagamento mínimo e data-alvo.
- Cenários de quitação e projeção da dívida.

### Configurações

- Percentuais de dízimo e investimento.
- Pessoas, bancos e categorias personalizadas.
- Orçamento mensal por categoria.

### Perfil, backup e tema

- Login com e-mail e senha, cadastro, Google e recuperação de senha.
- Alteração do nome do perfil.
- Exportação de uma cópia completa em Excel.
- Importação de planilha exportada anteriormente.
- Backup automático antes de uma importação que substitua dados existentes.
- Tema claro e escuro.
- Lembrete mensal para exportar uma cópia dos dados.

## Tecnologias utilizadas

- HTML5, CSS3 e JavaScript.
- TypeScript para a nova camada de cálculos e integrações.
- Vite para desenvolvimento e build de produção.
- Vitest para testes automatizados.
- Firebase Authentication para login.
- Cloud Firestore para persistência.
- Firebase Hosting para publicação.
- Firestore Security Rules para isolamento dos dados por usuário.
- SheetJS (`xlsx`) para planilhas Excel.
- SVG gerado no navegador para gráficos.
- Service Worker e Web App Manifest para o PWA.

## Como os dados são armazenados

Cada usuário possui um documento principal no caminho:

```text
usuarios/{uid}/dados/principal
```

Esse documento contém lançamentos, dívidas, configurações, listas personalizadas e orçamentos. As regras do Firestore permitem acesso somente quando o UID autenticado corresponde ao UID do caminho e o documento é `principal`.

## Estrutura do projeto

```text
public/
├── index.html                 # Estrutura principal
├── css/
│   ├── foundation/            # Tokens, cores, tipografia e tema
│   ├── components/            # Componentes visuais reutilizáveis
│   ├── pages/                 # Estilos específicos das telas
│   └── style.css              # Entrada dos estilos
├── js/                        # Runtime legado carregado em ordem
├── src/                       # Integrações modulares e PWA
├── ts/                        # Domínio tipado e funções puras
├── tests/                     # Testes dos cálculos financeiros
├── icons/                     # Ícones do PWA
├── manifest.json              # Manifesto de instalação
├── sw.js                      # Service Worker
├── firestore.rules            # Regras do Firestore
├── firebase.json              # Hosting, headers e Firestore
├── vite.config.ts             # Configuração do Vite
└── package.json               # Scripts e dependências
```

## Desenvolvimento local

Requisitos: Node.js 18 ou superior e npm. Firebase CLI é necessária apenas para publicar.

```bash
npm install
npm run dev
```

Valide tipos, testes e build:

```bash
npm run validate
```

Comandos individuais:

```bash
npm run typecheck
npm run test
npm run build
npm run preview
```

## Publicação no Firebase

```bash
firebase login
npm run deploy
```

O comando publica o build da pasta `dist/` e as regras do Firestore:

```bash
npm run build
firebase deploy --only hosting,firestore
```

## Segurança e privacidade

- Os dados financeiros são associados ao usuário autenticado.
- O Firestore não deve ser usado sem as regras de segurança deste projeto.
- Nunca adicione senhas, tokens privados ou arquivos `.env` ao repositório.
- A configuração pública do Firebase identifica o projeto; a proteção real depende da autenticação e das regras do Firestore.
- A dependência `xlsx` possui avisos de segurança conhecidos no npm audit e não tem correção disponível na versão utilizada. O processamento de planilhas deve ser substituído ou isolado antes de cenários mais sensíveis.

## Estado da arquitetura

O app está em uma migração gradual. O runtime original ainda usa scripts globais carregados em ordem para preservar o comportamento existente. Os cálculos centrais já possuem uma camada TypeScript testada, o Vite já gera o build e a integração modular do Firebase foi iniciada.

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para a estratégia de migração e as regras para futuras manutenções.

## Licença

Este projeto é privado e destinado ao uso pessoal, salvo definição diferente pelo proprietário do repositório.
