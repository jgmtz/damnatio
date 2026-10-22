// Builds the theme images for the game's itch.io page (itch/jogo/tema/) from the game's own art.
// Usage: node tools/itch-page.mjs   (run tools/itch-kit.mjs first: it makes the glaze tile)
// - banner.png: the vase's four faces, darkened, behind the title, between two Greek-key bands.
// - embed.png: the three portals behind the "Run game" button (16:9).
// - divisor.png: a thin golden thread with its knot, to separate sections of the description.

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { woffToTtf } from './woff2ttf.mjs';

const root = join(import.meta.dirname, '..');
const out = join(root, 'itch/jogo/tema');
mkdirSync(out, { recursive: true });
const art = (p) => join(root, 'assets/art', p);

const fonts = mkdtempSync(join(tmpdir(), 'damnatio-fonts-'));
// Written once per weight: the text renderer keeps the file open after its first use.
const fontFiles = new Map();
const font = (weight) => {
  if (!fontFiles.has(weight)) {
    const file = join(fonts, `cinzel-${weight}.ttf`);
    writeFileSync(file, woffToTtf(readFileSync(join(root, `node_modules/@fontsource/cinzel/files/cinzel-latin-${weight}-normal.woff`))));
    fontFiles.set(weight, file);
  }
  return fontFiles.get(weight);
};
const text = async (markup, weight, size, spacing = 0) =>
  sharp({ text: { text: `<span letter_spacing="${spacing * 1024}">${markup}</span>`, font: `Cinzel ${size}`, fontfile: font(weight), rgba: true, dpi: 72 } }).png().toBuffer({ resolveWithObject: true });

// The Greek-key band, repeated to a width.
const keyBand = async (width, height) => {
  const panel = await sharp(art('ui/painel_meandro.png')).metadata();
  const src = await sharp(art('ui/painel_meandro.png'))
    .extract({ left: 40, top: 0, width: panel.width - 80, height: 44 })
    .resize({ height })
    .toBuffer({ resolveWithObject: true });
  const tiles = [];
  for (let x = 0; x < width; x += src.info.width) tiles.push({ input: src.data, left: x, top: 0 });
  return sharp({ create: { width, height, channels: 4, background: '#0c0907' } }).composite(tiles).png().toBuffer();
};

// --- Banner: 1920 wide (itch shows it at the column width, so it stays sharp on wide screens) ---
{
  const W = 1920;
  const BAND = 44;
  const FACE_H = 400;
  const H = FACE_H + BAND * 2;
  const faces = ['cidade', 'vestais', 'monstro', 'chama'];
  const faceW = Math.floor(W / faces.length);
  const tiles = [];
  for (const [i, name] of faces.entries()) {
    const src = art(`prologue/vaso_face_${name}.jpg`);
    const m = await sharp(src).metadata();
    const scale = FACE_H / m.height;
    const cropW = Math.round(faceW / scale);
    const input = await sharp(src)
      .extract({ left: Math.round((m.width - cropW) / 2), top: 0, width: cropW, height: m.height })
      .resize({ width: faceW, height: FACE_H })
      .modulate({ brightness: 0.32, saturation: 0.8 })
      .toBuffer();
    tiles.push({ input, left: i * faceW, top: BAND });
  }
  // A soft dark pool in the middle, so the title reads over the faces.
  const pool = Buffer.from(
    `<svg width="${W}" height="${FACE_H}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%">` +
      `<stop offset="0" stop-color="#0c0907" stop-opacity="0.85"/><stop offset="1" stop-color="#0c0907" stop-opacity="0"/>` +
      `</radialGradient></defs><ellipse cx="${W / 2}" cy="${FACE_H / 2}" rx="${W * 0.36}" ry="${FACE_H * 0.62}" fill="url(#g)"/></svg>`,
  );
  const title = await text('<span foreground="#D9B45A">DAMNATIO</span>', 700, 150, 10);
  const subtitle = await text('<span foreground="#F1E3CF">EVERY THREAD HAS A PRICE</span>', 400, 44, 10);
  const knot = await sharp(art('threads/fio_no_atado.png')).trim().resize({ width: 1500 }).toBuffer({ resolveWithObject: true });
  const band = await keyBand(W, BAND);
  const titleTop = BAND + Math.round((FACE_H - title.info.height - subtitle.info.height - knot.info.height - 24) / 2);
  const knotTop = titleTop + title.info.height + 2;
  const subTop = knotTop + knot.info.height + 22;
  await sharp({ create: { width: W, height: H, channels: 4, background: '#0c0907' } })
    .composite([
      ...tiles,
      { input: pool, left: 0, top: BAND },
      { input: title.data, left: Math.round((W - title.info.width) / 2), top: titleTop },
      { input: knot.data, left: Math.round((W - knot.info.width) / 2), top: knotTop },
      { input: subtitle.data, left: Math.round((W - subtitle.info.width) / 2), top: subTop },
      { input: band, left: 0, top: 0 },
      { input: band, left: 0, top: H - BAND },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(out, 'banner.png'));
  console.log(`itch/jogo/tema/banner.png ${W}x${H}`);
}

// --- Embed background: the three portals, darkened, 16:9 ---
{
  const W = 1920;
  const H = 1080;
  await sharp(art('backgrounds/labirinto_portais_frente.jpg'))
    .resize({ width: W, height: H, fit: 'cover' })
    .modulate({ brightness: 0.28 })
    .jpeg({ quality: 86 })
    .toFile(join(out, 'embed.jpg'));
  console.log(`itch/jogo/tema/embed.jpg ${W}x${H}`);
}

// --- Profile banner (itch/perfil/banner_perfil.png): the author's name over the glaze, the knotted
// thread and the motto, with two faces of the vase fading in at the ends ---
{
  const W = 1920;
  const BAND = 40;
  const MID = 360;
  const H = MID + BAND * 2;
  const tile = await sharp(join(root, 'itch/perfil/fundo.png')).toBuffer();
  const ground = [];
  for (let x = 0; x < W; x += 720) for (let y = 0; y < MID; y += 240) {
    const w = Math.min(720, W - x);
    const h = Math.min(240, MID - y);
    ground.push({ input: w < 720 || h < 240 ? await sharp(tile).extract({ left: 0, top: 0, width: w, height: h }).toBuffer() : tile, left: x, top: BAND + y });
  }
  // A face of the vase, faded towards the middle of the banner.
  const SIDE = 520;
  const side = async (name, fadeTo) => {
    const src = art(`prologue/vaso_face_${name}.jpg`);
    const m = await sharp(src).metadata();
    const cropW = Math.round(SIDE * (m.height / MID));
    const img = await sharp(src)
      .extract({ left: Math.round((m.width - cropW) / 2), top: 0, width: cropW, height: m.height })
      .resize({ width: SIDE, height: MID })
      .modulate({ brightness: 0.75 })
      .ensureAlpha()
      .toBuffer();
    const [x1, x2] = fadeTo === 'right' ? ['0%', '100%'] : ['100%', '0%'];
    const mask = Buffer.from(
      `<svg width="${SIDE}" height="${MID}"><defs><linearGradient id="g" x1="${x1}" x2="${x2}">` +
        `<stop offset="0.35" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
        `</linearGradient></defs><rect width="${SIDE}" height="${MID}" fill="url(#g)"/></svg>`,
    );
    return sharp(img).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  };
  const left = await side('vestais', 'right');
  const right = await side('monstro', 'left');
  const name = await text('<span foreground="#D9B45A">JGMTZ</span>', 700, 120, 18);
  const motto = await text('<span foreground="#F1E3CF">NARRATIVE GAMES PAINTED LIKE GREEK VASES</span>', 400, 34, 6);
  const knot = await sharp(art('threads/fio_no_atado.png')).trim().resize({ width: 820 }).toBuffer({ resolveWithObject: true });
  const band = await keyBand(W, BAND);
  const block = name.info.height + knot.info.height + motto.info.height + 30;
  const nameTop = BAND + Math.round((MID - block) / 2);
  const knotTop = nameTop + name.info.height + 6;
  const mottoTop = knotTop + knot.info.height + 24;
  await sharp({ create: { width: W, height: H, channels: 4, background: '#0c0907' } })
    .composite([
      ...ground,
      { input: left, left: 0, top: BAND },
      { input: right, left: W - SIDE, top: BAND },
      { input: name.data, left: Math.round((W - name.info.width) / 2), top: nameTop },
      { input: knot.data, left: Math.round((W - knot.info.width) / 2), top: knotTop },
      { input: motto.data, left: Math.round((W - motto.info.width) / 2), top: mottoTop },
      { input: band, left: 0, top: 0 },
      { input: band, left: 0, top: H - BAND },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(root, 'itch/perfil/banner_perfil.png'));
  console.log(`itch/perfil/banner_perfil.png ${W}x${H}`);
}

// --- Divider: the golden thread with its knot ---
{
  const knot = await sharp(art('threads/fio_no_atado.png')).trim().resize({ width: 900 }).png().toBuffer({ resolveWithObject: true });
  await sharp(knot.data).png({ compressionLevel: 9 }).toFile(join(out, 'divisor.png'));
  console.log(`itch/jogo/tema/divisor.png ${knot.info.width}x${knot.info.height}`);
}
