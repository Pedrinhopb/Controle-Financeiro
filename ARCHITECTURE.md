# Arquitetura do Controle Financeiro

## Estado atual

O app é uma aplicação web estática com scripts globais carregados em ordem no `index.html`. Essa ordem é parte do contrato atual: módulos posteriores usam estado e funções definidos pelos anteriores.

## Direção de manutenção

```text
public/
  css/
    foundation/   tokens e tema
    components/   controles reutilizáveis
    pages/        estilos específicos de tela
    style.css     entrada legada durante a migração
  js/
    core/         estado, persistência e utilitários
    ui/           navegação e controles de interface
    pages/        comportamento por tela
    integrations/ Firebase Auth, Excel e lembretes
  ts/             domínio tipado sem DOM
```

## Sequência segura

1. Extrair estilos por grupo e validar desktop/mobile.
2. Extrair funções puras de cálculo para `ts/` e cobrir com testes.
3. Migrar páginas para módulos ES com imports explícitos.
4. Adotar Vite e trocar o Firebase compat pelo SDK modular.
5. Remover os arquivos globais legados somente após a validação completa.

Não mover arquivos numerados diretamente antes da etapa 3: isso quebra referências globais existentes e torna o diagnóstico de regressões mais difícil.
