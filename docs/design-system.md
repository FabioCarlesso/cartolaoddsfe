# Design System

> Paleta, classes utilitárias e tipografia. As regras de uso — nunca hardcode de cor,
> breakpoints, degradação do cabeçalho — estão em [`context.md`](context.md#design-system).

Definido em `src/styles.scss` via CSS custom properties:

## Paleta

```scss
:root {
  --bg-primary:    #0a0f1a;   // fundo da página
  --bg-secondary:  #111827;   // inputs, dropdowns
  --bg-card:       #1a2332;   // cards
  --border:        #2d3748;   // bordas padrão
  --green-primary: #22c55e;   // destaque principal
  --green-dark:    #16a34a;   // hover de botões
  --gold:          #f59e0b;   // capitão, alertas
  --red:           #ef4444;   // erros
  --blue:          #3b82f6;   // informação
  --text-primary:  #f1f5f9;
  --text-secondary:#94a3b8;
  --text-muted:    #64748b;
}
```

## Classes Utilitárias Globais

| Classe | Uso |
|---|---|
| `.page-container` | `max-width: 1200px`, centralizado |
| `.page-header` | Flex row com `justify-content: space-between` |
| `.page-title` | Título H1 com fonte Space Grotesk |
| `.section-title` | Título H2 de seção |
| `.card` | Card com fundo, borda e sombra padrão |
| `.btn.btn-primary` | Botão verde |
| `.btn.btn-secondary` | Botão com borda |
| `.form-control` | Input/select estilizado |
| `.badge.*` | Badges coloridos (green, gold, red, blue, purple) |
| `.empty-state` | Estado vazio centralizado |

## Tipografia

- **Corpo:** `Inter` (Google Fonts)
- **Títulos e números:** `Space Grotesk` (Google Fonts)
