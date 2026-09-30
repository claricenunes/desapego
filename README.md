# Desapego

Site estático (HTML + CSS + JS) do meu brechó pessoal. As peças vêm do `pecas.json`.

## Arquivos

| Arquivo / pasta | Para que serve |
|---|---|
| `index.html` | A página (topo, filtros, grade, rodapé, lightbox) |
| `estilo.css` | Visual (cores lilás/rosa, etiquetas numeradas) |
| `app.js` | Lê o `pecas.json`, monta a grade, filtros, fotos e botões do WhatsApp |
| `pecas.json` | **As peças**: é o único arquivo que precisa mexer no dia a dia |
| `fotos/` | Fotos originais (não são usadas direto no site) |
| `img/p/`, `img/g/` | Fotos otimizadas geradas pelo script (grade e ampliada) |
| `capa.jpg` | Imagem que aparece quando o link é colado no WhatsApp |
| `scripts/otimizar-fotos.py` | Gera `img/` e `capa.jpg` a partir de `fotos/` |

## Marcar uma peça como vendida

No `pecas.json`, adicione `"vendido": true` na peça:

```json
{
  "numero": 5,
  "nome": "Body preto com fivelas",
  ...
  "destaque": false,
  "vendido": true,
  "fotos": ["fotos/05-body-preto-com-fivelas.jpg"]
}
```

Atenção à vírgula no fim da linha de cima. Depois é só publicar de novo (veja abaixo).
A peça fica cinza, com o selo "Vendido", e o número não muda.

## Preços e faixas

- `"nova": true` → coloca o selo "Nunca usada" na foto da peça.
- `"preco": 50` → aparece na etiqueta da peça. A faixa de preços do topo (mínimo, máximo e média)
  e a média de cada faixa são calculadas sozinhas a partir desses valores (peças vendidas ficam de fora).
- `"grupo": "Especiais"` / `"Intermediárias"` / `"Básicas"` → separa a lista em faixas com título.
  Os subtítulos ("as queridinhas" etc.) ficam no começo do `app.js`, em `SECOES`.
- Os textos fixos do `index.html` (faixa que corre no topo, o número de peças, "a partir de R$ 10" e as tags
  Open Graph) não se atualizam sozinhos: se mudar muito o catálogo, ajuste lá e rode o script para refazer a `capa.jpg`.

## Adicionar ou trocar fotos

1. Coloque a foto em `fotos/` (ex.: `54-nome-da-peca.jpg`) e adicione a peça no `pecas.json`.
2. Rode `python3 scripts/otimizar-fotos.py` (precisa do Pillow: `pip3 install pillow`).
3. Publique de novo.

## Ver no computador antes de publicar

Abrir o `index.html` com dois cliques **não funciona** (o navegador bloqueia a leitura do `pecas.json`).
No Terminal, dentro desta pasta:

```sh
python3 -m http.server 8000
```

e abra http://localhost:8000

## Links diretos

- Uma categoria: `.../#tops`, `#blusas`, `#vestidos`, `#saias-shorts`, `#calcas`, `#moletons`, `#sapatos`, `#bolsa`
- Uma peça: `.../#peca-07`
