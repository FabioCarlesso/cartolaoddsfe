# Documentação — Cartola Odds Frontend

| Arquivo | O que contém |
|---|---|
| [`arquitetura.md`](arquitetura.md) | Camadas `core`/`shared`/`features`, estrutura de pastas, bootstrap e proxy de desenvolvimento |
| [`funcionalidades.md`](funcionalidades.md) | Comportamento de cada tela e do que a sustenta: sessão, erros, modelos, serviços HTTP, componentes compartilhados e features |
| [`rotas.md`](rotas.md) | Mapa completo de rotas, com componente carregado, guarda e nível de acesso |
| [`design-system.md`](design-system.md) | Paleta, classes utilitárias globais e tipografia |
| [`desenvolvimento.md`](desenvolvimento.md) | Ferramental de testes, estratégia por camada e cobertura por spec |
| [`deploy.md`](deploy.md) | Build de produção, prerender da landing, Docker e nginx |
| [`context.md`](context.md) | Decisões de arquitetura, convenções do código e regras de negócio — o porquê das coisas |
| [`prints-da-landing.md`](prints-da-landing.md) | Como refazer as capturas de tela usadas na landing |

Para instalar e rodar o projeto, veja o [README](../README.md).

## Onde documentar cada mudança

Antes desta consolidação (#51) o mesmo assunto vivia em até três arquivos: o bloco de Docker
estava no `README.md` e no `context.md`, a tabela de rotas no `README.md` e na documentação
técnica, a cobertura de testes nos dois. Atualizar um e esquecer o outro não quebrava nada —
só deixava o repositório com duas versões da verdade. Para isso não voltar, cada assunto tem um
dono:

| Se você mudou… | Documente em |
|---|---|
| Comportamento de uma tela, endpoint consumido, validação, tratamento de erro | `docs/funcionalidades.md` |
| Uma rota (nova, removida, com guarda ou perfil diferente) | `docs/rotas.md` |
| Estrutura de pastas, camadas, providers ou proxy | `docs/arquitetura.md` |
| Variável CSS, classe utilitária, tipografia | `docs/design-system.md` |
| Testes, cobertura ou ferramental de desenvolvimento | `docs/desenvolvimento.md` |
| Build, prerender, Docker ou nginx | `docs/deploy.md` |
| Uma decisão técnica, uma convenção ou uma regra de negócio — e o porquê dela | `docs/context.md` |
| **Como instalar ou rodar o projeto** | `README.md` — e só nesse caso |

Regra prática: se a informação não ajuda alguém a colocar o projeto no ar nos primeiros cinco
minutos, ela não pertence ao `README.md`. E se ela responde "por que é assim?", não pertence a
nenhum arquivo de referência — vai para o `context.md`.

Esta tabela não é espelhada em nenhum outro arquivo: quem precisa dela é apontado para cá pelo
`README.md` e pelo `context.md`. Duas cópias de uma tabela de donos teriam o mesmo problema que
esta consolidação veio resolver.

## O que não documentar à mão

Listas que o repositório já responde não são mantidas aqui: árvore de pastas arquivo a arquivo e
mapa de `.spec.ts` nascem desatualizados no primeiro componente novo e ninguém percebe. O
`arquitetura.md` descreve as pastas e o desenho que se repete em cada feature, não os arquivos
dentro delas; `find src -name '*.spec.ts'` e `npm test -- --code-coverage` respondem sobre os
testes. Documente o que o código não diz sozinho — o comportamento da tela e o porquê da decisão.

Backlog também não mora aqui. Melhoria prevista, ideia e pendência viram issue — foi o que a #51 fez
com a seção "Próximas Melhorias Previstas" que vivia no `context.md`, onde itens já entregues
seguiam marcados como pendentes.
