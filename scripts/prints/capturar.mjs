// Captura as telas reais da aplicação (servidas por `servidor-demo.mjs`) via CDP.
import { writeFile } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://localhost:4310';
const PORTA_CDP = Number(process.argv[3] ?? 9333);
const DESTINO = process.argv[4];

const LARGURA = 1440;
const ALTURA = 900;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pendentes = new Map();
    this.ws.addEventListener('message', (evento) => {
      const msg = JSON.parse(evento.data);
      if (msg.id && this.pendentes.has(msg.id)) {
        const { resolve, reject } = this.pendentes.get(msg.id);
        this.pendentes.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }

  enviar(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pendentes.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function conectar() {
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    try {
      const alvos = await (await fetch(`http://localhost:${PORTA_CDP}/json/list`)).json();
      const pagina = alvos.find((a) => a.type === 'page');
      if (pagina) {
        const ws = new WebSocket(pagina.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
          ws.addEventListener('open', resolve, { once: true });
          ws.addEventListener('error', reject, { once: true });
        });
        return new Cdp(ws);
      }
    } catch {
      /* chrome ainda subindo */
    }
    await esperar(250);
  }
  throw new Error('não foi possível conectar ao Chrome');
}

async function avaliar(cdp, expressao) {
  const { result } = await cdp.enviar('Runtime.evaluate', {
    expression: expressao,
    returnByValue: true,
    awaitPromise: true
  });
  return result.value;
}

async function esperarSeletor(cdp, seletor, tempoLimite = 15000) {
  const limite = Date.now() + tempoLimite;
  while (Date.now() < limite) {
    if (await avaliar(cdp, `!!document.querySelector(${JSON.stringify(seletor)})`)) {
      return;
    }
    await esperar(200);
  }
  throw new Error(`seletor não apareceu: ${seletor}`);
}

async function capturar(cdp, { arquivo, rota, seletor, antes }) {
  await cdp.enviar('Page.navigate', { url: `${BASE}${rota}` });
  await esperar(1200);
  if (antes) {
    await antes(cdp);
  }
  await esperarSeletor(cdp, seletor);
  // Respiro para fontes, transições de barra de score e imagens assentarem.
  await esperar(1200);

  const { data } = await cdp.enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${DESTINO}/${arquivo}.png`, Buffer.from(data, 'base64'));
  console.log(`capturado: ${arquivo}.png`);
}

const cdp = await conectar();
await cdp.enviar('Page.enable');
await cdp.enviar('Runtime.enable');
await cdp.enviar('Emulation.setDeviceMetricsOverride', {
  width: LARGURA,
  height: ALTURA,
  deviceScaleFactor: 1,
  mobile: false
});

await capturar(cdp, { arquivo: 'time', rota: '/time', seletor: '.pitch app-player-card' });
await capturar(cdp, { arquivo: 'ranking', rota: '/ranking', seletor: 'app-consistencia-badge' });
await capturar(cdp, {
  arquivo: 'comparar',
  rota: '/comparar',
  seletor: '.result-card',
  antes: async (c) => {
    await esperarSeletor(c, '.controls-bar .btn-primary, .btn-primary');
    await avaliar(
      c,
      `(() => {
        const botao = Array.from(document.querySelectorAll('button.btn-primary'))
          .find((b) => b.textContent.includes('Comparar'));
        botao?.click();
        return !!botao;
      })()`
    );
    await esperar(800);
  }
});
await capturar(cdp, { arquivo: 'historico', rota: '/historico', seletor: '.rodada-card' });

await avaliar(cdp, 'window.close && 0');
process.exit(0);
