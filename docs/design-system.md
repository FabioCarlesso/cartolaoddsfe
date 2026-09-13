# Design System

> Paleta, classes utilitárias e tipografia. As regras de uso — nunca hardcode de cor,
> breakpoints, degradação do cabeçalho — estão em [`context.md`](context.md#design-system).

Definido em `src/styles.scss` via CSS custom properties, em dois temas. O escuro vive no
`:root` e é o padrão histórico; o claro entra pelo mixin `tema-claro`, aplicado em
`:root[data-theme='claro']` e, para quem nunca escolheu, em
`@media (prefers-color-scheme: light)`. Quem escreve o atributo é o
[`ThemeService`](funcionalidades.md#coreservicesthemeservicets) — e, antes dele, o script inline
do `index.html`.

## Paleta

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--bg-primary` | `#0a0f1a` | `#f1f5f9` | fundo da página |
| `--bg-secondary` | `#111827` | `#ffffff` | inputs, dropdowns |
| `--bg-card` | `#1a2332` | `#ffffff` | cards |
| `--bg-card-hover` | `#1e2d42` | `#f8fafc` | hover de card |
| `--bg-nav` | `rgba(10,15,26,.95)` | `rgba(255,255,255,.95)` | fundo do cabeçalho fixo |
| `--border` | `#2d3748` | `#d8dee9` | bordas padrão |
| `--border-light` | `#374151` | `#cbd5e1` | bordas em hover |
| `--green-primary` | `#22c55e` | `#15803d` | destaque principal |
| `--green-dark` | `#16a34a` | `#166534` | hover de botões |
| `--on-green` | `#000` | `#ffffff` | texto sobre preenchimento verde |
| `--gold` | `#f59e0b` | `#b45309` | capitão, alertas |
| `--red` | `#ef4444` | `#dc2626` | erros |
| `--blue` | `#3b82f6` | `#1d4ed8` | informação |
| `--purple` | `#8b5cf6` | `#6d28d9` | reserva de luxo, perfis |
| `--text-primary` | `#f1f5f9` | `#0f172a` | texto principal |
| `--text-secondary` | `#94a3b8` | `#475569` | texto secundário |
| `--text-muted` | `#64748b` | `#64748b` | texto de apoio |

Cada cor de destaque tem um par `--*-text` (`--green-text`, `--gold-text`, `--red-text`,
`--blue-text`, `--purple-text`, `--indigo-text`) para quando ela é **texto**: o verde-claro que
se lê sobre `#0a0f1a` some sobre branco, então o token muda de valor com o tema e o componente só
pede "a cor de texto do verde". Os véus neutros seguem a mesma ideia e invertem no tema claro:
`--overlay-subtle`, `--overlay-soft`, `--overlay-medium` e `--focus-ring`.

`--green-light`, `--gold-light`, `--red-light` e `--blue-light` continuam sendo os fundos suaves
de badge, e `--shadow`/`--shadow-lg` são mais discretas no tema claro.

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

## Controle de tema

O cabeçalho (`AppComponent`) traz o botão `.btn-tema`, visível com ou sem sessão. Ele alterna
entre os dois temas pelo `ThemeService`, que persiste a escolha e aplica o atributo — o
comportamento completo está em
[`ThemeService`](funcionalidades.md#coreservicesthemeservicets).

## Tipografia

- **Corpo:** `Inter` (Google Fonts)
- **Títulos e números:** `Space Grotesk` (Google Fonts)
