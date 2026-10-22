// Binary-mask helpers shared by the art tools (clean-art.ts, fx-sheets.ts).

function diskOffsets(radius: number): [number, number][] {
  const offsets: [number, number][] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) offsets.push([dx, dy]);
    }
  }
  return offsets;
}

/** Erosion (all) or dilation (any) of a binary mask with a disk. Outside the image counts as `edge`. */
export function morph(mask: Uint8Array, w: number, h: number, radius: number, mode: 'erode' | 'dilate'): Uint8Array {
  const out = new Uint8Array(w * h);
  const offsets = diskOffsets(radius);
  const erode = mode === 'erode';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let result = erode ? 1 : 0;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        // Outside the image behaves like background, so regions touching the border erode normally.
        const v = nx < 0 || ny < 0 || nx >= w || ny >= h ? 1 : mask[ny * w + nx]!;
        if (erode && !v) {
          result = 0;
          break;
        }
        if (!erode && v && !(nx < 0 || ny < 0 || nx >= w || ny >= h)) {
          result = 1;
          break;
        }
      }
      out[y * w + x] = result;
    }
  }
  return out;
}

/**
 * Keeps connected components (4-neighbour) that touch the border or have at least `minArea` pixels.
 * `bottomIsFigure`: the bottom edge doesn't count as border (busts, cut off by the bottom edge, whose
 * pale cloth would otherwise be taken for background reaching in from there).
 */
export function keepBackgroundComponents(mask: Uint8Array, w: number, h: number, minArea: number, bottomIsFigure = false): Uint8Array {
  const label = new Int32Array(w * h).fill(-1);
  const out = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || label[start] !== -1) continue;
    const pixels: number[] = [];
    let touchesBorder = false;
    stack.push(start);
    label[start] = start;
    while (stack.length) {
      const i = stack.pop()!;
      pixels.push(i);
      const x = i % w;
      const y = (i - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || (y === h - 1 && !bottomIsFigure)) touchesBorder = true;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (n >= 0 && mask[n] && label[n] === -1) {
          label[n] = start;
          stack.push(n);
        }
      }
    }
    if (touchesBorder || pixels.length >= minArea) for (const i of pixels) out[i] = 1;
  }
  return out;
}

/**
 * Alpha for art painted on black (RGBA in place): the background is the dark area wide enough to
 * hold a disk of `lineRadius` and reachable from the border (or a big enclosed hole); thin dark
 * strokes inside survive. A 1–2 px dark contour is kept, with a soft outer edge.
 */
export function removeBlack(data: Buffer | Uint8Array, w: number, h: number, threshold: number, lineRadius: number, minHoleArea: number): void {
  const dark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) dark[i] = Math.max(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!) <= threshold ? 1 : 0;
  const opened = morph(morph(dark, w, h, lineRadius, 'erode'), w, h, lineRadius, 'dilate');
  for (let i = 0; i < w * h; i++) opened[i] = opened[i]! & dark[i]!;
  const background = keepBackgroundComponents(opened, w, h, minHoleArea);
  const figure = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) figure[i] = background[i] ? 0 : 1;
  const ring1 = morph(figure, w, h, 1, 'dilate');
  const ring2 = morph(figure, w, h, 2, 'dilate');
  for (let i = 0; i < w * h; i++) {
    let alpha = 255;
    if (background[i]) alpha = ring1[i] ? 255 : ring2[i] ? 110 : 0;
    if (alpha < 255) data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
    data[i * 4 + 3] = alpha;
  }
}
