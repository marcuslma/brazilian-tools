# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Adicionado

- Normalização canônica de CPF, CNPJ, RG e CEP.
- Validação, normalização, formatação e parsing de telefones fixos e celulares brasileiros.
- Lista imutável dos 67 DDDs geográficos brasileiros.
- Cache de CEP injetável, resposta original opcional e consulta em lote com concorrência limitada.
- A cobertura passou a usar `c8` com filtro do build ESM, compatível com Node 20, 22 e 26.
- Builds ESM e CommonJS com exports condicionais para `import` e `require`.
- Subpath exports para `cpf`, `cnpj`, `rg`, `phone` e `cep`.
- Validação estrutural conservadora de RGs sem algoritmo estadual implementado.
- Política configurável de fallback para CEP não encontrado.

### Alterado

- `generateRG` agora concentra a geração simples e o retorno opcional da UF com `includeState: true`.
- A consulta de CEP usa somente `lookupCEP`; o provedor é selecionado pela opção `provider`.
- A validação de RG com `state` agora rejeita UFs sem algoritmo suportado; sem `state`, permanece estrutural.
- Respostas de fetchers customizados que chegam após timeout ou cancelamento não são mais aceitas.
- A suíte passou a exigir 100% de cobertura de linhas e funções no quality gate.
- O algoritmo de RG continua restrito às UFs listadas em `SUPPORTED_RG_STATES`.
- O timeout de CEP agora é compartilhado entre as chamadas aos provedores, incluindo eventual fallback.
- Respostas de CEP sem os campos mínimos passam a ser tratadas como falha do provedor.
- Erros HTTP 4xx definitivos não acionam fallback; HTTP 408, 429 e 5xx continuam elegíveis.
- Sinais já cancelados impedem chamadas de rede, e lotes deixam de iniciar novos itens após a primeira falha.
- Entradas numéricas negativas, decimais ou fora do intervalo seguro passam a ser rejeitadas.
- CEPs do ViaCEP são sempre devolvidos com máscara, e coordenadas vazias deixam de virar `(0, 0)`.
- Timeouts acima do limite suportado por `setTimeout` são rejeitados antes da chamada de rede.
- Tipos de `fetch` e cancelamento de CEP agora são autocontidos para consumidores TypeScript sem DOM.
- Falhas do cache injetado passam a ser encapsuladas em `CEPRequestError` e preservadas em `cause`.
- Coordenadas da BrasilAPI fora das faixas geográficas válidas deixam de ser publicadas.
- O script de limpeza passa a usar `node:fs`, mantendo compatibilidade com Windows.

## [0.1.0] - 2026-07-21

### Adicionado

- Validação, formatação e geração de CPF.
- Validação, formatação e geração de CNPJ numérico e alfanumérico.
- Validação, formatação e geração de RG de São Paulo.
- Validação e formatação estrutural de CEP.
- Consulta de CEP pela BrasilAPI com fallback para ViaCEP.
- Tipos TypeScript e suporte ESM sem dependências de produção.
