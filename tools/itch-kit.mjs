// Builds the itch.io profile kit (itch/perfil/) from the game's own painted art.
// Usage: node tools/itch-kit.mjs
// - banner.png: the four faces of the empire's vase in a frieze between two Greek-key bands.
// - avatar.png: the bull behind the bars (the "monster" face), square.
// - fundo.png: black glaze with crackle, mirrored so it tiles without seams.

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { woffToTtf } from './woff2ttf.mjs';

const root = join(import.meta.dirname, '..');
const out = join(root, 'itch/perfil');
mkdirSync(out, { recursive: true });
mkdirSync(join(root, 'itch/jogo'), { recursive: true });
const art = (p) => join(root, 'assets/art', p);

const W = 1920;
const FACE_H = 400;
const BAND_H = 56;
const GAP = 8;

// The Greek-key band: the top band of the meander panel, without its corners, repeated.
const panel = await sharp(art('ui/painel_meandro.png')).metadata();
const bandSrc = await sharp(art('ui/painel_meandro.png'))
  .extract({ left: 40, top: 0, width: panel.width - 80, height: 44 })
  .resize({ height: BAND_H })
  .toBuffer({ resolveWithObject: true });
const band = await (async () => {
  const tiles = [];
  for (let x = 0; x < W; x += bandSrc.info.width) tiles.push({ input: bandSrc.data, left: x, top: 0 });
  return sharp({ create: { width: W, height: BAND_H, channels: 4, background: '#0c0907' } }).composite(tiles).png().toBuffer();
})();

// The frieze: each face cropped around its middle, side by side with a thin black seam.
const faces = ['cidade', 'vestais', 'monstro', 'chama'];
const faceW = Math.floor((W - GAP * (faces.length - 1)) / faces.length);
const faceTiles = [];
for (const [i, name] of faces.entries()) {
  const src = art(`prologue/vaso_face_${name}.jpg`);
  const m = await sharp(src).metadata();
  const scale = FACE_H / m.height;
  const cropW = Math.round(faceW / scale);
  const input = await sharp(src)
    .extract({ left: Math.round((m.width - cropW) / 2), top: 0, width: cropW, height: m.height })
    .resize({ width: faceW, height: FACE_H })
    .toBuffer();
  faceTiles.push({ input, left: i * (faceW + GAP), top: BAND_H });
}
const H = BAND_H * 2 + FACE_H;
await sharp({ create: { width: W, height: H, channels: 4, background: '#0c0907' } })
  .composite([{ input: band, left: 0, top: 0 }, ...faceTiles, { input: band, left: 0, top: BAND_H + FACE_H }])
  .png({ compressionLevel: 9 })
  .toFile(join(out, 'banner.png'));

// Avatar: the bull's head behind the bars.
await sharp(art('prologue/vaso_face_monstro.jpg'))
  .extract({ left: 292, top: 0, width: 440, height: 440 })
  .resize(512, 512)
  .png()
  .toFile(join(out, 'avatar.png'));

// Background tile: the black glaze of the dark panel, mirrored both ways (seamless).
const glaze = await sharp(art('ui/painel_negro.png')).extract({ left: 40, top: 46, width: 360, height: 120 }).toBuffer();
const flop = await sharp(glaze).flop().toBuffer();
const flip = await sharp(glaze).flip().toBuffer();
const both = await sharp(glaze).flip().flop().toBuffer();
await sharp({ create: { width: 720, height: 240, channels: 4, background: '#0c0907' } })
  .composite([
    { input: glaze, left: 0, top: 0 },
    { input: flop, left: 360, top: 0 },
    { input: flip, left: 0, top: 120 },
    { input: both, left: 360, top: 120 },
  ])
  .modulate({ brightness: 0.8 })
  .png()
  .toFile(join(out, 'fundo.png'));

console.log(`itch/perfil: banner ${W}x${H}, avatar 512x512, fundo 720x240`);

// --- The game's cover (itch asks 630x500; made at twice that) ---
// The bull behind the bars on the black glaze, the golden thread tied in its knot, the title in the
// game's Cinzel, and the Greek key above and below.
{
  const CW = 1260;
  const CH = 1000;
  const fonts = mkdtempSync(join(tmpdir(), 'damnatio-fonts-'));
  const font = (weight) => {
    const file = join(fonts, `cinzel-${weight}.ttf`);
    writeFileSync(file, woffToTtf(readFileSync(join(root, `node_modules/@fontsource/cinzel/files/cinzel-latin-${weight}-normal.woff`))));
    return file;
  };
  const text = async (markup, weight, size, spacing = 0) =>
    sharp({ text: { text: `<span letter_spacing="${spacing * 1024}">${markup}</span>`, font: `Cinzel ${size}`, fontfile: font(weight), rgba: true, dpi: 72 } }).png().toBuffer({ resolveWithObject: true });

  const tile = await sharp(join(out, 'fundo.png')).toBuffer();
  const ground = [];
  for (let x = 0; x < CW; x += 720) for (let y = 0; y < CH; y += 240) {
    const w = Math.min(720, CW - x);
    const h = Math.min(240, CH - y);
    ground.push({ input: w < 720 || h < 240 ? await sharp(tile).extract({ left: 0, top: 0, width: w, height: h }).toBuffer() : tile, left: x, top: y });
  }
  const keyBand = await sharp(band).resize({ width: CW, height: BAND_H, fit: 'cover', position: 'left' }).toBuffer();

  // The bull: the top of the "monster" face (bars, head, the coping of the wall), framed by thin key bands.
  const bullW = 1120;
  const bull = await sharp(art('prologue/vaso_face_monstro.jpg'))
    .extract({ left: 0, top: 0, width: 1024, height: 470 })
    .resize({ width: bullW })
    .toBuffer({ resolveWithObject: true });
  const bullTop = BAND_H + 34;

  const knot = await sharp(art('threads/fio_no_atado.png')).trim().resize({ width: CW - 80 }).toBuffer({ resolveWithObject: true });
  const title = await text('<span foreground="#D9B45A">DAMNATIO</span>', 700, 150, 6);
  const subtitle = await text('<span foreground="#F1E3CF">EVERY THREAD HAS A PRICE</span>', 400, 50, 8);

  const knotTop = bullTop + bull.info.height - Math.round(knot.info.height / 2) + 6;
  const titleTop = knotTop + knot.info.height + 26;
  const subTop = titleTop + title.info.height + 22;
  await sharp({ create: { width: CW, height: CH, channels: 4, background: '#0c0907' } })
    .composite([
      ...ground,
      { input: keyBand, left: 0, top: 0 },
      { input: bull.data, left: Math.round((CW - bullW) / 2), top: bullTop },
      { input: knot.data, left: 40, top: knotTop },
      { input: title.data, left: Math.round((CW - title.info.width) / 2), top: titleTop },
      { input: subtitle.data, left: Math.round((CW - subtitle.info.width) / 2), top: subTop },
      { input: keyBand, left: 0, top: CH - BAND_H },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(root, 'itch/jogo/capa.png'));
  console.log('itch/jogo/capa.png 1260x1000');
}
