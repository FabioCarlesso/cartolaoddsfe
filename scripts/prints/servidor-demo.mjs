// Serve o build da aplicação com uma API de demonstração no lugar do backend, e injeta no
// index.html a semente de sessão (token fictício) para as capturas caírem direto nas telas.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
import { comparar, historico, montarTime, ranking } from './dados-demo.mjs';

const RAIZ = process.argv[2];
const PORTA = Number(process.argv[3] ?? 4310);
// Modo "backend desligado": sem semente de sessão e com toda a /api fora do ar, para conferir
// que a landing renderiza inteira sozinha.
const SEM_BACKEND = process.argv[4] === 'sem-backend';

function base64url(objeto) {
  return Buffer.from(JSON.stringify(objeto)).toString('base64url');
}

// Token só de fachada: o frontend lê os claims sem validar assinatura, e o backend real nunca
// vê este token — a API aqui é o mock abaixo.
const token = [
  base64url({ alg: 'none', typ: 'JWT' }),
  base64url({
    sub: 'demo@cartolaodds.local',
    perfil: 'ADMIN',
    usuarioId: 1,
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  ''
].join('.');

const semente = `<script>
  localStorage.setItem('cartolaodds.accessToken', ${JSON.stringify(token)});
  localStorage.setItem('cartolaodds.nome', 'Cartoleiro Demo');
  sessionStorage.setItem('comparacao.formacoes', JSON.stringify(['4-3-3', '3-4-3', '4-4-2', '5-3-2']));
</script>`;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function json(res, corpo) {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(corpo));
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    if (SEM_BACKEND) {
      console.log(`CHAMADA INDEVIDA A ${url.pathname}`);
      res.writeHead(503);
      return res.end();
    }
    if (url.pathname === '/api/time') {
      const orcamento = url.searchParams.get('orcamento');
      return json(res, montarTime({ GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3, TEC: 1 }, 12, orcamento ? Number(orcamento) : 170));
    }
    if (url.pathname === '/api/time/comparar') {
      return json(res, comparar(url.searchParams.getAll('formacoes')));
    }
    if (url.pathname === '/api/ranking') {
      return json(res, ranking(Number(url.searchParams.get('limite') ?? 25)));
    }
    if (url.pathname === '/api/historico') {
      return json(res, historico());
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    return res.end('{"message":"rota não mockada"}');
  }

  const caminho = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  const arquivo = join(RAIZ, caminho);

  try {
    const conteudo = await readFile(arquivo);
    // Espelha o nginx de produção: gzip nos textos e cache longo nos estáticos versionados.
    const comprimivel = ['.js', '.css', '.html', '.svg'].includes(extname(arquivo));
    const cabecalhos = {
      'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable'
    };
    if (comprimivel && (req.headers['accept-encoding'] ?? '').includes('gzip')) {
      const zipado = gzipSync(conteudo);
      res.writeHead(200, { ...cabecalhos, 'content-encoding': 'gzip' });
      return res.end(zipado);
    }
    res.writeHead(200, cabecalhos);
    return res.end(conteudo);
  } catch {
    // Espelha o nginx de produção: a raiz recebe a landing pré-renderizada e as demais rotas
    // caem no shell vazio (`index.csr.html`), para nenhuma tela interna piscar a landing antes
    // de a aplicação assumir.
    const arquivoHtml = url.pathname === '/' ? 'index.html' : 'index.csr.html';
    const html = await readFile(join(RAIZ, arquivoHtml), 'utf8');
    const corpo = SEM_BACKEND ? html : html.replace('</head>', `${semente}</head>`);
    // O nginx comprime `text/html` sempre que o gzip está ligado, independentemente de
    // `gzip_types`; sem isto aqui, a landing pré-renderizada trafegaria crua e a medição de
    // performance sairia pior do que a produção.
    if ((req.headers['accept-encoding'] ?? '').includes('gzip')) {
      res.writeHead(200, { 'content-type': TIPOS['.html'], 'cache-control': 'no-cache', 'content-encoding': 'gzip' });
      return res.end(gzipSync(corpo));
    }
    res.writeHead(200, { 'content-type': TIPOS['.html'], 'cache-control': 'no-cache' });
    return res.end(corpo);
  }
});

servidor.listen(PORTA, () => console.log(`demo em http://localhost:${PORTA}`));
