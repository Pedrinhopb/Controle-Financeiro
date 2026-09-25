# Organização de scripts

Os arquivos numerados ainda são carregados como scripts globais para preservar o runtime atual.

## Grupos de responsabilidade

- `core/`: estado, configuração Firebase, persistência e utilitários.
- `ui/`: navegação, seletores, tema e inicialização.
- `pages/`: Lançamentos, Dashboard, Categorias, Dívida e Configurações.
- `integrations/`: autenticação, Excel e lembretes.

A camada `ts/` contém os primeiros módulos de domínio tipados e sem dependência do DOM. A migração dos scripts globais para esses grupos deve acontecer junto com o Vite, usando imports explícitos e uma validação por página.
