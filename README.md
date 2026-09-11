# Cartola Odds — Frontend

> Dashboard Angular para montar times estratégicos no Cartola FC com base em odds e métricas de atletas.

> **Papel deste arquivo:** porta de entrada do repositório — o que o projeto é, como rodar, como
> buildar e para onde ir atrás do resto. A referência técnica completa (rotas, componentes,
> serviços, contratos) está em [`docs/`](./docs/README.md) — o índice diz qual arquivo é dono de
> cada assunto; as decisões de arquitetura e as convenções do código, em
> [`docs/context.md`](./docs/context.md).

---

## Visão Geral

Interface web que consome a [Cartola Odds API](https://github.com/FabioCarlesso) e apresenta:

- **Landing pública na raiz** (`/`) explicando o produto e a engenharia por trás dele, com as telas reais do sistema — renderiza inteira sem o backend no ar
- **Time ideal da rodada** em formação 4-3-3 visual, com orçamento máximo opcional (cartoletas) — o time é sempre o de maior score, e quando há orçamento, o maior score possível dentro do teto — custo total e barra de saldo
- **Ranking de atletas** por score ponderado com filtros por posição, opção de excluir jogadores em dúvida e indicador de consistência (desvio padrão)
- **Análise de favoritos** com odds, probabilidades implícitas e jogos descartados
- **Comparação de formações** que monta o melhor time em até 5 formações ao mesmo tempo, ranqueia por score total e permite aplicar a formação escolhida na configuração global
- **Histórico de escalações** por rodada, com o comparativo entre o score sugerido e a pontuação real
- **Painel de configurações** para ajustar parâmetros de negócio (odd limite, pesos do score, formação) e gerenciar cache em runtime
- **Cota da The Odds API** com o estado do guardrail e o consumo do ciclo
- **Gestão de usuários** restrita a administradores, para criar acessos, trocar perfil e ativar/desativar contas

O acesso é autenticado: a API exige um JWT em todos os endpoints, e o frontend guarda a sessão, envia o token em cada chamada e reage à expiração. Os usuários são criados por um administrador — não há auto-cadastro. Quem chega sem sessão encontra a landing; quem já tem sessão e abre `/` vai direto para o time da rodada.

A lista completa de telas, com rota, guarda e nível de acesso, está em
[`docs/rotas.md`](./docs/rotas.md).

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 21.2 | Framework principal (standalone components) |
| TypeScript | 5.9 | Linguagem |
| RxJS | 7.8 | Gerenciamento de fluxos assíncronos |
| Angular Router | 21.2 | Roteamento com lazy loading |
| Angular HttpClient | 21.2 | Comunicação HTTP com o backend |
| SCSS | — | Estilização com CSS custom properties |
| @angular/ssr + platform-server | 21.2 | Prerender (SSG) da landing no build — sem servidor Node em produção |

O porquê de cada escolha está em [Decisões de stack](./docs/context.md#decisões-de-stack).

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Backend **Cartola Odds API** rodando em `http://localhost:8080`
- Docker + Docker Compose *(para execução containerizada)*

---

## Como Executar

### Desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo desenvolvimento (com proxy para o backend)
npm start

# 3. Acessar no browser
open http://localhost:4200
```

> O `npm start` usa `proxy.conf.json` que redireciona `/api` → `http://localhost:8080`, evitando problemas de CORS em desenvolvimento.

### Build de Produção

```bash
npm run build
# Artefatos em dist/cartolaoddsfe/browser/
```

O build pré-renderiza a rota `/`: a landing sai pronta no `index.html`, sem esperar o bootstrap
do Angular. As demais rotas usam o `index.csr.html`, o mesmo shell vazio de sempre. O nginx do
`Dockerfile` já faz essa separação; ao servir o `dist` em outro servidor, aponte `/` para
`index.html` e o fallback de SPA para `index.csr.html` — o porquê está em
[Landing pública, prerender e layout do shell](./docs/context.md#landing-pública-prerender-e-layout-do-shell),
e os detalhes do build em [`docs/deploy.md`](./docs/deploy.md).

### Testes

```bash
# Executar todos os testes (headless)
npm test

# Cobertura de código
npm test -- --code-coverage
# Relatório em coverage/cartolaoddsfe/index.html

# Manter os testes em watch mode
npm test -- --watch
```

O projeto usa **Karma + Jasmine**, com cobertura em todas as camadas. A estratégia de teste por
camada e o mapa de cenários por arquivo de spec estão em [`docs/desenvolvimento.md`](./docs/desenvolvimento.md).

---

## Docker

```bash
# 1. Copiar e configurar variáveis de ambiente
cp .env.example .env

# 2. Subir o container
docker compose up -d

# 3. Acessar
open http://localhost:4200
```

O único valor que costuma mudar é o `BACKEND_URL` (padrão `http://host.docker.internal:8080`),
que funciona sem ajuste quando o backend roda em `localhost:8080` — tanto no Docker Desktop
quanto no Linux, porque o `docker-compose.yml` já mapeia `host.docker.internal` para o host.

A lista de arquivos, as variáveis de ambiente, os comandos de operação e os limites de recurso
estão em [`docs/deploy.md`](./docs/deploy.md#docker); as decisões por trás dessa configuração,
em [Docker — decisões e limites](./docs/context.md#docker--decisões-e-limites).

---

## Documentação

| Arquivo | O que contém |
|---|---|
| `README.md` (este) | Porta de entrada: o que é, como rodar, como buildar, para onde ir depois |
| [`docs/arquitetura.md`](./docs/arquitetura.md) | Camadas, estrutura de pastas, bootstrap e proxy de desenvolvimento |
| [`docs/funcionalidades.md`](./docs/funcionalidades.md) | Comportamento de cada tela: sessão, erros, modelos, serviços e features |
| [`docs/rotas.md`](./docs/rotas.md) | Mapa de rotas com componente, guarda e nível de acesso |
| [`docs/design-system.md`](./docs/design-system.md) | Paleta, classes utilitárias e tipografia |
| [`docs/desenvolvimento.md`](./docs/desenvolvimento.md) | Ferramental e estratégia de testes, com a cobertura por spec |
| [`docs/deploy.md`](./docs/deploy.md) | Build de produção, prerender, Docker e nginx |
| [`docs/context.md`](./docs/context.md) | Decisões de arquitetura, convenções do código e as regras de negócio refletidas na UI |
| [`docs/prints-da-landing.md`](./docs/prints-da-landing.md) | Como refazer as capturas de tela usadas na landing |

Antes de documentar uma mudança, veja em [`docs/README.md`](./docs/README.md) qual arquivo é o
dono do assunto.

> **Regra do repositório:** PR que muda a aparência das telas de time, ranking, comparação ou histórico precisa refazer o print correspondente da landing. A página é pública e é a primeira coisa que alguém vê do projeto.

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](./LICENSE) para o texto completo.
