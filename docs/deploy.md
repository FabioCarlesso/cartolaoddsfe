# Build e Deploy

> Build de produção, prerender da landing, imagem Docker e nginx. As decisões por trás dessa
> configuração estão em [`context.md`](context.md#docker--decisões-e-limites).

## Build

Os comandos de desenvolvimento, build e teste estão em
[Como Executar](../README.md#como-executar).

### `angular.json` — Builder

Usa o builder esbuild (`@angular-devkit/build-angular:application`), padrão do Angular 21:

- **Output:** `dist/cartolaoddsfe/`
- **Entry:** `src/main.ts` (navegador) e `src/main.server.ts` (prerender)
- **Styles:** `src/styles.scss`
- **Polyfills:** `zone.js`
- **Output hashing:** habilitado em produção

### Prerender da landing (SSG)

A rota `/` é pré-renderizada no build: o HTML da landing sai pronto do `npm run build`, sem
esperar o bootstrap do Angular no navegador. Não há servidor Node em produção — `ssr` fica
desligado e o deploy continua sendo o nginx servindo arquivos estáticos.

```jsonc
// angular.json → architect.build.options
"server": "src/main.server.ts",
"prerender": { "discoverRoutes": false, "routesFile": "prerender-routes.txt" },
"ssr": false
```

O `prerender-routes.txt` lista só a raiz, e `discoverRoutes: false` é deliberado — o porquê
está em [Landing pública, prerender e layout do shell](./context.md#landing-pública-prerender-e-layout-do-shell).

O build gera **dois** HTML na pasta `browser/`:

| Arquivo | Conteúdo | Quem serve |
|---|---|---|
| `index.html` | Landing pré-renderizada, com as marcas de hidratação | `location = /` no nginx |
| `index.csr.html` | Shell com `<app-root></app-root>` vazio | Fallback de SPA das demais rotas |

A separação evita um efeito colateral do prerender, descrito em
[Landing pública, prerender e layout do shell](./context.md#landing-pública-prerender-e-layout-do-shell).

O `provideClientHydration()` no `app.config.ts` faz o Angular reaproveitar o HTML pré-renderizado
em vez de descartá-lo e desenhar tudo de novo.

### URL do backend em produção

Não há `environment.ts` — a URL do backend é definida diretamente nos serviços como `/api` e resolvida pelo proxy em dev ou pelo servidor web em produção.

Para produção, configure o servidor web (nginx/Apache) para redirecionar `/api/*` → `http://backend:8080/api/*`.

---

## Docker

### Arquivos

| Arquivo | Descrição |
|---|---|
| `Dockerfile` | Build multi-stage: Node 20 Alpine (build) + nginx 1.27 Alpine (runtime) |
| `nginx.conf.template` | Config nginx com template envsubst para `BACKEND_URL` e `NGINX_RESOLVER` |
| `docker-entrypoint.sh` | Descobre o DNS do container, fixa nome vindo do `/etc/hosts`, renderiza o template e sobe o nginx |
| `docker-compose.yml` | Orquestração com healthcheck e resource limits |
| `.env.example` | Template de variáveis — copiar para `.env` antes de usar |
| `.dockerignore` | Exclui `node_modules/`, `dist/`, `.angular/`, specs e docs do contexto de build |

### Dockerfile — Multi-stage Build

```
Stage 1 — build (node:20-alpine)
  └── npm ci --legacy-peer-deps
  └── npm run build
        └── gera dist/cartolaoddsfe/browser/

Stage 2 — runtime (nginx:1.27-alpine)
  └── COPY nginx.conf.template
  └── COPY --from=build dist/cartolaoddsfe/browser → /usr/share/nginx/html
  └── USER appuser (não-root)
  └── EXPOSE 80
  └── CMD: envsubst + nginx
```

O porquê de cada escolha — multi-stage, usuário não-root, `envsubst` em runtime,
`host.docker.internal` — está em
[Docker — decisões e limites](./context.md#docker--decisões-e-limites).

### nginx.conf.template

Configurações habilitadas:

| Recurso | Detalhe |
|---|---|
| SPA routing | `try_files $uri $uri/ /index.html` — suporta client-side routing |
| Proxy `/api/` | Proxia para `${BACKEND_URL}` preservando o caminho original — sem CORS em produção. O `location` usa `^~` para que um `/api/algo.png` não caia na regra de assets estáticos |
| Re-resolução do backend | O destino passa por variável (`set $backend`) com `resolver ... valid=10s`, então o nginx reconsulta o DNS a cada 10s em vez de congelar o IP na subida. Sem isso, um redeploy do backend com IP novo deixa `/api/` em 504 `upstream timed out while connecting` até o frontend reiniciar |
| Cache de assets | `Cache-Control: public, immutable` por 1 ano para JS/CSS/fontes |
| Gzip | Compressão habilitada para `text/*`, `application/json`, `application/javascript` |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` — definidos em `nginx-security-headers.conf` e incluídos em cada `location` do SPA. Em `/api/` valem os headers do Spring Security; o nginx só preenche como fallback quando gera a resposta sozinho (502/504). `X-XSS-Protection` não é enviado: o auditor XSS legado foi removido dos navegadores e o backend define `0` deliberadamente |

### Variáveis de ambiente do container

| Variável | Padrão | Descrição |
|---|---|---|
| `BACKEND_URL` | `http://host.docker.internal:8080` | URL do backend Cartola Odds API. Se o nome existir no `/etc/hosts` do container (o caso do padrão, via `extra_hosts`), o entrypoint fixa o IP na subida, porque o resolver do nginx não lê esse arquivo |
| `NGINX_RESOLVER` | lido do `/etc/resolv.conf` | Servidores de DNS usados para re-resolver o `BACKEND_URL`. Definido pelo `docker-entrypoint.sh`; sobrescrever só para apontar a um DNS específico |
| `APP_PORT` | `4200` | Porta exposta no host |

### Comandos

O início rápido (copiar o `.env` e subir o container) está em
[Docker no README](../README.md#docker). Os demais comandos de operação:

```bash
# Rebuild após mudança de código
docker compose up -d --build

# Logs
docker compose logs -f frontend

# Status e healthcheck
docker compose ps

# Parar
docker compose down

# Build manual
docker build -t cartola-odds-frontend:1.0.0 .

# Executar sem Compose (Linux: --add-host para resolver host.docker.internal)
docker run -p 4200:80 \
  --add-host=host.docker.internal:host-gateway \
  -e BACKEND_URL=http://host.docker.internal:8080 \
  cartola-odds-frontend:1.0.0
```

### Resource Limits (docker-compose.yml)

```yaml
deploy:
  resources:
    limits:
      memory: 128m
      cpus: "0.5"
    reservations:
      memory: 64m
      cpus: "0.1"
```

O dimensionamento está justificado em
[Docker — decisões e limites](./context.md#docker--decisões-e-limites).
