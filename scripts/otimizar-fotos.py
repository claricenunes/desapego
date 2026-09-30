#!/usr/bin/env python3
"""Gera as fotos otimizadas do site a partir de fotos/ (os originais não são alterados).

  img/p/<nome>.webp  → versão da grade (até 640px no lado maior)
  img/g/<nome>.webp  → versão ampliada do lightbox (até 1400px no lado maior)
  capa.jpg           → imagem de capa 1200x630 para o link no WhatsApp (Open Graph)

Uso:  python3 scripts/otimizar-fotos.py
Requer: Pillow  (pip3 install pillow)
"""
import json
from pathlib import Path

import io

from PIL import Image, ImageCms, ImageDraw, ImageFont, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
EXTENSOES = {".jpg", ".jpeg", ".png", ".webp"}
SRGB = ImageCms.createProfile("sRGB")
TAMANHOS = {"p": (640, 78), "g": (1400, 82)}  # pasta: (lado maior, qualidade)


def abrir(caminho):
    im = Image.open(caminho)
    im = ImageOps.exif_transpose(im)  # respeita a rotação do celular
    icc = im.info.get("icc_profile")
    if im.mode in ("RGBA", "LA", "P"):  # PNG com transparência: fundo branco
        im = im.convert("RGBA")
        fundo = Image.new("RGBA", im.size, "white")
        im = Image.alpha_composite(fundo, im)
    im = im.convert("RGB")
    if icc:  # ex.: fotos do iPhone em Display P3 → sRGB, para as cores saírem certas na web
        origem = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        im = ImageCms.profileToProfile(im, origem, SRGB, outputMode="RGB")
    return im


def otimizar():
    fotos = sorted(f for f in (RAIZ / "fotos").iterdir() if f.suffix.lower() in EXTENSOES)
    for pasta, (lado, qualidade) in TAMANHOS.items():
        destino = RAIZ / "img" / pasta
        destino.mkdir(parents=True, exist_ok=True)
        for f in fotos:
            saida = destino / (f.stem + ".webp")
            if saida.exists() and saida.stat().st_mtime > f.stat().st_mtime:
                continue
            im = abrir(f)
            im.thumbnail((lado, lado), Image.LANCZOS)
            im.save(saida, "WEBP", quality=qualidade, method=6)
    print(f"{len(fotos)} fotos otimizadas em img/p e img/g")


def cobrir(im, w, h):
    return ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(0.5, 0.45))


def polaroid(foto, lado, borda, cor_borda):
    """Foto quadrada com moldura branca de polaroid (mais larga embaixo) e contorno."""
    m = 12
    base = Image.new("RGBA", (lado + 2 * m, lado + m + 42), (255, 255, 255, 255))
    base.paste(cobrir(foto, lado, lado), (m, m))
    ImageDraw.Draw(base).rectangle((0, 0, base.width - 1, base.height - 1), outline=cor_borda, width=borda)
    return base


def colar_girado(img, peca, x, y, angulo, sombra):
    """Cola a peça girada com uma sombra sólida deslocada (estilo adesivo)."""
    g = peca.rotate(angulo, resample=Image.BICUBIC, expand=True)
    alfa = g.getchannel("A")
    img.paste(Image.new("RGB", g.size, sombra), (x + 7, y + 7), alfa)
    img.paste(g, (x, y), alfa)


def capa():
    dados = json.loads((RAIZ / "pecas.json").read_text(encoding="utf-8"))
    pecas = dados["pecas"]
    destaques = [p for p in pecas if p.get("destaque")][:3]
    precos = [p["preco"] for p in pecas if p.get("preco") is not None and not p.get("vendido")]
    W, H = 1200, 630
    choque, ameixa, lima = (219, 42, 112), (36, 18, 46), (216, 243, 106)
    img = Image.new("RGB", (W, H), choque)
    d = ImageDraw.Draw(img)

    fonte = "/System/Library/Fonts/Avenir Next.ttc"
    try:
        titulo = ImageFont.truetype(fonte, 100, index=8)  # Heavy
        texto = ImageFont.truetype(fonte, 34, index=0)  # Bold
        pequeno = ImageFont.truetype(fonte, 29, index=5)  # Medium
        selo_g = ImageFont.truetype(fonte, 40, index=8)
        selo_p = ImageFont.truetype(fonte, 20, index=0)
    except OSError:
        titulo = texto = pequeno = selo_g = selo_p = ImageFont.load_default()

    # Polaroids das peças em destaque, à direita
    posicoes = [(610, 150, 8), (780, 60, -5), (920, 210, 6)]
    for p, (x, y, ang) in zip(destaques, posicoes):
        colar_girado(img, polaroid(abrir(RAIZ / p["fotos"][0]), 220, 4, ameixa), x, y, ang, ameixa)

    # Título "Desa" em ameixa + "pego" em lima com contorno e sombra
    tx, ty = 56, 140
    d.text((tx, ty), "Desa", font=titulo, fill=ameixa)
    x2 = tx + d.textlength("Desa", font=titulo)
    d.text((x2 + 6, ty + 6), "pego", font=titulo, fill=ameixa, stroke_width=4, stroke_fill=ameixa)
    d.text((x2, ty), "pego", font=titulo, fill=lima, stroke_width=4, stroke_fill=ameixa)

    d.text((tx, 296), f"{len(pecas)} peças · {dados['tamanhos']}", font=texto, fill="white")
    linha2 = f"Média de R$ {round(sum(precos) / len(precos))} · aceito propostas" if precos else "Aceito propostas"
    d.text((tx, 342), linha2, font=pequeno, fill="white")
    d.text((tx, 382), "Retirada no Sudoeste", font=pequeno, fill="white")

    # Selo lima "a partir de R$ X"
    if precos:
        r = 80
        selo = Image.new("RGBA", (2 * r + 8, 2 * r + 8), (0, 0, 0, 0))
        ds = ImageDraw.Draw(selo)
        ds.ellipse((4, 4, 2 * r + 4, 2 * r + 4), fill=lima, outline=ameixa, width=5)
        c = r + 4
        ds.text((c, c - 26), "a partir de", font=selo_p, fill=ameixa, anchor="mm")
        ds.text((c, c + 16), f"R$ {min(precos)}", font=selo_g, fill=ameixa, anchor="mm")
        colar_girado(img, selo, 405, 418, 10, ameixa)

    img.save(RAIZ / "capa.jpg", "JPEG", quality=86, optimize=True, progressive=True)
    print("capa.jpg gerada")


if __name__ == "__main__":
    otimizar()
    capa()
