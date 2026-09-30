// Desapego — monta a grade a partir do pecas.json

// Filtros do topo: cada botão junta uma ou mais categorias do JSON.
// Categorias novas que não estejam aqui ganham um botão próprio automaticamente.
const GRUPOS = [
  { id: 'tops', nome: 'Tops', cats: ['Top'] },
  { id: 'blusas', nome: 'Blusas', cats: ['Blusa', 'Tricô'] },
  { id: 'vestidos', nome: 'Vestidos', cats: ['Vestido'] },
  { id: 'saias-shorts', nome: 'Saias e shorts', cats: ['Saia', 'Short'] },
  { id: 'calcas', nome: 'Calças', cats: ['Calça'] },
  { id: 'moletons', nome: 'Moletons', cats: ['Moletom'] },
  { id: 'sapatos', nome: 'Sapatos e tênis', cats: ['Sapato', 'Tênis'] },
  { id: 'bolsa', nome: 'Bolsa', cats: ['Bolsa'] },
];

// Subtítulo de cada faixa de peças (campo "grupo" no JSON)
const SECOES = {
  'Especiais': 'as queridinhas',
  'Intermediárias': 'ótimas e em conta',
  'Básicas': 'o básico que salva',
};

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nn = n => String(n).padStart(2, '0');
const brl = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
const media = l => l.reduce((a, b) => a + b, 0) / l.length;
const ICONE_WA = '<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

// "fotos/01-sapatilha-1.jpg" → "img/p/01-sapatilha-1.webp" (p = grade, g = ampliada)
const foto = (caminho, tam) => `img/${tam}/${caminho.split('/').pop().replace(/\.[^.]+$/, '')}.webp`;

let WA = '5561999449043';
const linkWA = p => `https://wa.me/${WA}?text=${encodeURIComponent(`Oi! Vi o desapego e tenho interesse na peça Nº ${nn(p.numero)} – ${p.nome}`)}`;

const grid = $('#grid');
let pecas = [];
let filtrado = false;       // alguma categoria escolhida?
let ordem = 'sugestao';     // 'sugestao' | 'menor' | 'maior'
let ordemOriginal = [];     // itens e títulos de faixa na ordem do JSON

carregar();

async function carregar() {
  try {
    const r = await fetch('pecas.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    const dados = await r.json();
    if (dados.whatsapp) WA = String(dados.whatsapp).replace(/\D/g, '');
    pecas = dados.pecas;
  } catch (e) {
    grid.innerHTML = `<li class="aviso vazio">Não consegui carregar as peças agora. Recarregue a página ou me chama no WhatsApp (61) 99944-9043.</li>`;
    console.error('Erro ao ler pecas.json. Se abriu o arquivo direto do computador, use um servidor local (veja o README).', e);
    return;
  }
  montarTopo();
  montarGrade();
  montarFiltros();
  montarOrdem();
}

// Faixa de preços e colagem de fotos do topo, calculadas a partir do JSON
function montarTopo() {
  const precos = pecas.filter(p => !p.vendido && p.preco != null).map(p => p.preco);
  if (precos.length) {
    $('#p-min').textContent = brl(Math.min(...precos));
    $('#p-max').textContent = brl(Math.max(...precos));
    $('#p-media').textContent = brl(Math.round(media(precos)));
  }
  $('#colagem').innerHTML = pecas.filter(p => p.destaque && p.fotos?.length).slice(0, 3)
    .map(p => `<figure class="polaroid"><img src="${foto(p.fotos[0], 'p')}" alt="" width="640" height="640" fetchpriority="high"></figure>`).join('');
}

function cabecalhoSecao(g) {
  const doGrupo = pecas.filter(p => p.grupo === g);
  const precos = doGrupo.filter(p => p.preco != null && !p.vendido).map(p => p.preco);
  const meta = [`${doGrupo.length} peça${doGrupo.length > 1 ? 's' : ''}`, precos.length && `média ${brl(Math.round(media(precos)))}`].filter(Boolean).join(' · ');
  return `<li class="secao"><div>${SECOES[g] ? `<small>${esc(SECOES[g])}</small>` : ''}<h2>${esc(g)}</h2></div><span class="meta">${meta}</span></li>`;
}

function montarGrade() {
  let grupoAtual;
  grid.innerHTML = pecas.map((p, i) => {
    let secao = '';
    if (p.grupo && p.grupo !== grupoAtual) { grupoAtual = p.grupo; secao = cabecalhoSecao(p.grupo); }
    const n = nn(p.numero);
    const fotos = p.fotos || [];
    const cedo = i < 4; // as primeiras aparecem logo na tela; o resto carrega sob demanda
    const slides = fotos.map((f, k) => `
      <button type="button" class="slide" data-k="${k}" aria-label="Ampliar foto ${k + 1} de ${fotos.length}: ${esc(p.nome)}">
        <img src="${foto(f, 'p')}" alt="${k ? '' : esc(p.nome)}" width="640" height="800"
          loading="${cedo && k === 0 ? 'eager' : 'lazy'}" decoding="async"${i < 2 && k === 0 ? ' fetchpriority="high"' : ''}>
      </button>`).join('');
    const dots = fotos.length > 1
      ? `<span class="qtd">${fotos.length} fotos</span><div class="dots">${fotos.map((_, k) =>
          `<button type="button" class="dot" data-k="${k}" aria-label="Ver foto ${k + 1}"${k ? '' : ' aria-current="true"'}></button>`).join('')}</div>`
      : '';
    const info = [p.categoria, p.tamanho && `Tam. ${p.tamanho}`].filter(Boolean).map(esc).join(' · ');
    return `${secao}
    <li class="item${p.destaque ? ' best' : ''}${p.vendido ? ' sold' : ''}" data-i="${i}" data-cat="${esc(p.categoria)}" id="peca-${n}">
      <div class="photo">
        <div class="track">${slides}</div>
        ${dots}
        ${p.nova && !p.vendido ? `<span class="nova${fotos.length > 1 ? ' com-qtd' : ''}">Nunca usada</span>` : ''}
        ${p.vendido ? '<span class="selo">Vendido</span>' : ''}
      </div>
      <span class="tag"><span class="tag-in"><span class="tag-n">Nº ${n}</span>${p.preco != null
        ? `<span class="tag-p"><small>R$</small>${esc(brl(p.preco).slice(3))}</span>` : ''}</span></span>
      <div class="corpo">
        <span class="cat">${info}</span>
        <h3>${esc(p.nome)}</h3>
        ${p.descricao ? `<p>${esc(p.descricao)}</p>` : ''}
        ${p.vendido
          ? '<span class="quero off" aria-disabled="true">Vendida</span>'
          : `<a class="quero" href="${linkWA(p)}" target="_blank" rel="noopener">${ICONE_WA}Quero essa</a>`}
      </div>
    </li>`;
  }).join('');

  // Bolinhas acompanham o deslizar do carrossel
  grid.querySelectorAll('.track').forEach(t => {
    const dots = t.parentElement.querySelectorAll('.dot');
    if (!dots.length) return;
    t.addEventListener('scroll', () => {
      const k = Math.round(t.scrollLeft / t.clientWidth);
      dots.forEach((d, j) => d.setAttribute('aria-current', j === k));
    }, { passive: true });
  });

  grid.addEventListener('click', e => {
    const dot = e.target.closest('.dot');
    if (dot) {
      const t = $('.track', dot.closest('.photo'));
      t.scrollTo({ left: dot.dataset.k * t.clientWidth, behavior: 'smooth' });
      return;
    }
    const slide = e.target.closest('.slide');
    if (slide) abrirLightbox(+slide.closest('.item').dataset.i, +slide.dataset.k);
  });
}

// ---------- Filtros ----------
function montarFiltros() {
  const conhecidas = new Set(GRUPOS.flatMap(g => g.cats));
  const extras = [...new Set(pecas.map(p => p.categoria))].filter(c => !conhecidas.has(c))
    .map(c => ({ id: slug(c), nome: c, cats: [c] }));
  const grupos = [...GRUPOS, ...extras]
    .map(g => ({ ...g, qtd: pecas.filter(p => g.cats.includes(p.categoria)).length }))
    .filter(g => g.qtd);

  const box = $('#filtros');
  box.innerHTML = [{ id: 'todas', nome: 'Todas', qtd: pecas.length }, ...grupos]
    .map(g => `<button type="button" class="filtro" data-id="${g.id}" aria-pressed="false">${esc(g.nome)}<small>${g.qtd}</small></button>`)
    .join('');

  const aplicar = (id, rolar) => {
    const g = grupos.find(x => x.id === id);
    if (!g) id = 'todas';
    box.querySelectorAll('.filtro').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
    const ativo = box.querySelector(`[data-id="${id}"]`);
    box.scrollTo({ left: ativo.offsetLeft - (box.clientWidth - ativo.offsetWidth) / 2, behavior: rolar ? 'smooth' : 'auto' });
    grid.querySelectorAll('.item').forEach(li => { li.hidden = !!g && !g.cats.includes(li.dataset.cat); });
    filtrado = !!g;
    atualizarSecoes();
    history.replaceState(null, '', id === 'todas' ? location.pathname + location.search : '#' + id);
    if (rolar) {
      const nav = $('.filtros');
      if (nav.getBoundingClientRect().top <= 1) window.scrollTo({ top: nav.offsetTop - 1 });
    }
  };

  box.addEventListener('click', e => {
    const b = e.target.closest('.filtro');
    if (b) aplicar(b.dataset.id, true);
  });

  // Link direto para uma categoria (ex.: .../#tops) ou para uma peça (ex.: .../#peca-07)
  const h = location.hash.slice(1);
  if (h.startsWith('peca-')) { aplicar('todas'); document.getElementById(h)?.scrollIntoView(); }
  else aplicar(h || 'todas');
}

// As faixas (Especiais, Intermediárias, Básicas) só aparecem em "Todas" e na ordem sugerida
function atualizarSecoes() {
  grid.querySelectorAll('.secao').forEach(s => { s.hidden = filtrado || ordem !== 'sugestao'; });
}

// ---------- Ordenar por preço ----------
function montarOrdem() {
  ordemOriginal = [...grid.children];
  const botoes = document.querySelectorAll('.ordem-btn');
  botoes.forEach(b => b.addEventListener('click', () => {
    ordem = b.dataset.ordem;
    botoes.forEach(x => x.setAttribute('aria-pressed', x === b));
    let lista = ordemOriginal;
    if (ordem !== 'sugestao') {
      const sinal = ordem === 'menor' ? 1 : -1;
      // Vendidas e peças sem preço vão para o fim; empate mantém a ordem sugerida
      const chave = li => { const p = pecas[li.dataset.i]; return p.vendido || p.preco == null ? null : p.preco; };
      lista = ordemOriginal.filter(el => el.classList.contains('item')).sort((a, b) => {
        const pa = chave(a), pb = chave(b);
        if (pa === null || pb === null) return (pa === null) - (pb === null) || a.dataset.i - b.dataset.i;
        return sinal * (pa - pb) || a.dataset.i - b.dataset.i;
      });
    }
    grid.append(...lista);
    atualizarSecoes();
    const nav = $('.filtros');
    if (nav.getBoundingClientRect().top <= 1) window.scrollTo({ top: nav.offsetTop - 1 });
  }));
}

// ---------- Lightbox ----------
const lb = $('#lightbox');
const lbTrack = $('#lb-track');
let lbPeca = null;

function abrirLightbox(i, k) {
  lbPeca = pecas[i];
  const fotos = lbPeca.fotos;
  lbTrack.innerHTML = fotos.map((f, j) =>
    `<div class="lb-slide"><img src="${foto(f, 'g')}" alt="${esc(lbPeca.nome)}, foto ${j + 1} de ${fotos.length}" decoding="async"></div>`).join('');
  const quero = $('#lb-quero');
  quero.hidden = !!lbPeca.vendido;
  quero.href = linkWA(lbPeca);
  $('#lb-ant').hidden = $('#lb-prox').hidden = fotos.length < 2;
  lb.showModal();
  document.documentElement.style.overflow = 'hidden';
  lbTrack.scrollLeft = k * lbTrack.clientWidth;
  legenda(k);
  // O botão "voltar" do celular fecha a foto em vez de sair do site
  history.pushState({ lightbox: true }, '');
}

function legenda(k) {
  const p = lbPeca, total = p.fotos.length;
  const extra = [p.preco != null && !p.vendido && `<em>${brl(p.preco)}</em>`, p.nova && 'nunca usada', p.tamanho && `Tam. ${esc(p.tamanho)}`, total > 1 && `foto ${k + 1} de ${total}`, p.vendido && 'Vendida'].filter(Boolean);
  $('#lb-legenda').innerHTML = `<b>Nº ${nn(p.numero)} · ${esc(p.nome)}</b>${extra.length ? `<span>${extra.join(' · ')}</span>` : ''}`;
}

const kAtual = () => Math.round(lbTrack.scrollLeft / lbTrack.clientWidth);
const irPara = k => lbTrack.scrollTo({ left: Math.max(0, Math.min(k, lbPeca.fotos.length - 1)) * lbTrack.clientWidth, behavior: 'smooth' });

lbTrack.addEventListener('scroll', () => lbPeca && legenda(kAtual()), { passive: true });
$('#lb-ant').addEventListener('click', () => irPara(kAtual() - 1));
$('#lb-prox').addEventListener('click', () => irPara(kAtual() + 1));
$('#lb-fechar').addEventListener('click', () => history.state?.lightbox ? history.back() : lb.close());
// Tocar no fundo (fora da foto) também fecha
lbTrack.addEventListener('click', e => { if (e.target.classList.contains('lb-slide')) $('#lb-fechar').click(); });
lb.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') irPara(kAtual() - 1);
  if (e.key === 'ArrowRight') irPara(kAtual() + 1);
});
lb.addEventListener('cancel', e => { e.preventDefault(); $('#lb-fechar').click(); }); // tecla Esc
lb.addEventListener('close', () => { document.documentElement.style.overflow = ''; lbPeca = null; });
window.addEventListener('popstate', () => { if (lb.open) lb.close(); });

// ---------- Copiar número ----------
$('#copiar').addEventListener('click', e => {
  const b = e.currentTarget;
  navigator.clipboard.writeText('61999449043').then(() => { b.textContent = 'Copiado!'; }).catch(() => {
    const r = document.createRange(); r.selectNodeContents($('#num'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selecionado';
  });
  setTimeout(() => { b.textContent = 'Copiar número'; }, 2000);
});
