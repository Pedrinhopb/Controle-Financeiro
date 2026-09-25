# Organização de estilos

`style.css` continua sendo o ponto de entrada carregado pelo `index.html`.

## Camadas

- `foundation/`: tokens, tema, tipografia e valores compartilhados.
- `components/`: controles reutilizáveis, formulários, tabelas, modais e feedback.
- `pages/`: regras específicas de Dashboard, Lançamentos, Dívida e Configurações.
	Atualmente `dashboard.css` e `debt.css` já foram extraídos.
- `style.css`: composição temporária das camadas durante a migração incremental.

A regra de manutenção é colocar novos estilos no grupo correspondente. As regras antigas serão extraídas por domínio em etapas, depois que cada grupo tiver uma validação visual e responsiva.
