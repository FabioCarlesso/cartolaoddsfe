# Captura dos prints da landing

Harness de desenvolvimento — não entra no build nem na imagem Docker. O passo a passo completo
está em [`docs/prints-da-landing.md`](../../docs/prints-da-landing.md).

| Arquivo | Papel |
|---|---|
| `dados-demo.mjs` | Dados fictícios das telas (nenhuma rodada real, nenhuma cota da Odds API) |
| `servidor-demo.mjs` | Serve o `dist/` com a API de demonstração e semeia a sessão no `index.html` |
| `capturar.mjs` | Dirige o Chrome headless por CDP, navega às telas e salva os PNGs |
