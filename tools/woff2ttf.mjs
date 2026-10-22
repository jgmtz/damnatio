// WOFF (version 1) → TTF, so the image tools (sharp's text renderer) can use the game's fonts.
// Usage: node tools/woff2ttf.mjs <in.woff> <out.ttf>

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function woffToTtf(woff) {
  if (woff.readUInt32BE(0) !== 0x774f4646) throw new Error('not a WOFF 1 file');
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const at = 44 + i * 20;
    const [tag, offset, compLength, origLength, checksum] = [
      woff.readUInt32BE(at),
      woff.readUInt32BE(at + 4),
      woff.readUInt32BE(at + 8),
      woff.readUInt32BE(at + 12),
      woff.readUInt32BE(at + 16),
    ];
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({ tag, checksum, data: compLength < origLength ? inflateSync(raw) : raw });
  }
  // sfnt header + table directory, then each table padded to 4 bytes.
  let entrySelector = 0;
  while (2 ** (entrySelector + 1) <= numTables) entrySelector++;
  const searchRange = 2 ** entrySelector * 16;
  const head = Buffer.alloc(12 + numTables * 16);
  head.writeUInt32BE(flavor, 0);
  head.writeUInt16BE(numTables, 4);
  head.writeUInt16BE(searchRange, 6);
  head.writeUInt16BE(entrySelector, 8);
  head.writeUInt16BE(numTables * 16 - searchRange, 10);
  let offset = head.length;
  const bodies = [];
  tables.forEach((t, i) => {
    const at = 12 + i * 16;
    head.writeUInt32BE(t.tag, at);
    head.writeUInt32BE(t.checksum, at + 4);
    head.writeUInt32BE(offset, at + 8);
    head.writeUInt32BE(t.data.length, at + 12);
    const padded = Buffer.alloc(Math.ceil(t.data.length / 4) * 4);
    t.data.copy(padded);
    bodies.push(padded);
    offset += padded.length;
  });
  return Buffer.concat([head, ...bodies]);
}

if (process.argv[1]?.endsWith('woff2ttf.mjs') && process.argv[3]) {
  writeFileSync(process.argv[3], woffToTtf(readFileSync(process.argv[2])));
}
