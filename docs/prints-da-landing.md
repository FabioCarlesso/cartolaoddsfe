# Prints da landing

A landing pública (`/`) mostra capturas das telas reais da aplicação. Elas envelhecem sozinhas:
qualquer PR que mude a aparência de **time**, **ranking**, **comparar** ou **histórico** precisa
refazer o print correspondente, senão a primeira tela que um visitante vê passa a mostrar um
sistema que não existe mais.

As capturas saem de uma **API de demonstração com dados fictícios**, e não do backend real. Não é
detalhe de conveniência: cada chamada ao backend consome cota da The Odds API (500 requisições por
mês no plano gratuito), e uma rodada real ficaria congelada na página para sempre.

## Arquivos publicados

| Arquivo | Origem | Uso |
|---|---|---|
| `src/assets/landing/time.webp` | `/time` | Galeria da landing (faixa "As telas do sistema") |
| `src/assets/landing/ranking.webp` | `/ranking` | Galeria da landing |
| `src/assets/landing/comparar.webp` | `/comparar` | Galeria da landing |
| `src/assets/landing/historico.webp` | `/historico` | Galeria da landing |
| `src/assets/landing/og.png` | recorte de `/time` | Imagem da prévia do link (Open Graph / Twitter Card) |

Todos os `.webp` têm **1440x900**. As dimensões estão declaradas em
`landing-prints.component.ts` (`largura`/`altura`) para o navegador reservar o espaço antes do
download; ao mudar o tamanho dos arquivos, mude também o componente.

## Como refazer

Pré-requisitos: `google-chrome` (ou `google-chrome-stable`) e `ffmpeg` no PATH.

```bash
# 1. Build da aplicação — as capturas são do build, não do dev server
npm run build

# 2. Sobe a aplicação com a API de demonstração (porta 4310)
node scripts/prints/servidor-demo.mjs dist/cartolaoddsfe/browser 4310 &

# 3. Sobe o Chrome headless com a porta de depuração aberta
google-chrome --headless=new --remote-debugging-port=9333 --no-sandbox --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,900 about:blank &

# 4. Captura as quatro telas em PNG
mkdir -p /tmp/prints
node scripts/prints/capturar.mjs http://localhost:4310 9333 /tmp/prints

# 5. Converte para os arquivos publicados (webp + og.png)
scripts/prints/converter.sh /tmp/prints
```

O `servidor-demo.mjs` injeta no `index.html` um token de fachada no `localStorage`, para as
capturas caírem direto nas telas internas sem passar pelo login, e semeia a seleção de formações
no `sessionStorage` para a tela de comparação já abrir com quatro formações escolhidas.

## Como conferir a landing depois

O mesmo servidor roda em modo **backend desligado**, que é o cenário em que a landing precisa
aparecer inteira:

```bash
node scripts/prints/servidor-demo.mjs dist/cartolaoddsfe/browser 4311 sem-backend
```

Nesse modo qualquer requisição a `/api/**` é recusada e registrada no log como
`CHAMADA INDEVIDA` — uma linha dessas ao abrir `/` significa que alguma faixa da landing passou a
depender do backend, o que o teste `should render without issuing a single HTTP request`
(`landing-page.component.spec.ts`) também barra.
