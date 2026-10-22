// Turns the author's sound effects (originais/audio/sfx) into the game's (assets/audio/sfx/<name>.ogg).
// Each one: the chosen stretch (start/end), the silence before the sound cut, a short fade at the end,
// and two-pass loudnorm to the same loudness. Needs ffmpeg on the PATH.
// Usage: node tools/sfx.mjs [name...]

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const only = process.argv.slice(2);
const outDir = join(root, 'assets/audio/sfx');
mkdirSync(outDir, { recursive: true });

/** Loudness of every effect (LUFS); the music sits at −18/−21, so effects read clearly above it. */
const LUFS = -16;

// src: file in originais/audio/sfx; start/end: seconds of the source kept; fade: seconds faded at the end.
const EFFECTS = [
  { name: 'thread_tie', src: 'thread_tie.wav', start: 0.5, end: 3.5, fade: 0.6 },
  { name: 'thread_cut', src: 'thread_cut.mp3', start: 0, end: 1.3, fade: 0.15 },
  // 83 s of rustling: the densest stretch.
  { name: 'thread_tangle', src: 'thread_tangle.flac', start: 12.45, end: 15.25, fade: 0.5 },
  { name: 'echo_tie', src: 'echo_tie.wav', start: 1.38, end: null, fade: 0.3 },
  { name: 'echo_fray', src: 'echo_fray.wav', start: 0, end: 3, fade: 0.9 },
  { name: 'echo_alert', src: 'echo_alert.wav', start: 0, end: 3.4, fade: 0.6 },
  { name: 'theron_fade', src: 'theron_Fade.wav', start: 0, end: 1.7, fade: 0.3 },
  { name: 'flame_waver', src: 'flame_waver.wav', start: 0, end: 3, fade: 0.6 },
  { name: 'bronze_knock', src: 'bronze_knock.mp3', start: 0, end: null, fade: 0.2 },
  { name: 'knock_gate', src: 'knock_gate.wav', start: 0, end: null, fade: 0.05 },
  { name: 'knocking_below', src: 'knock_below.wav', start: 0, end: null, fade: 0.08 },
];

const probe = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim());

for (const fx of EFFECTS) {
  if (only.length && !only.includes(fx.name)) continue;
  const src = join(root, 'originais/audio/sfx', fx.src);
  const end = fx.end ?? probe(src);
  // The fade is applied reversed (a fade-in of the reversed clip), so it always ends exactly at the
  // last sample, however much silence was cut from the start.
  const shape =
    `atrim=start=${fx.start}:end=${end},asetpts=PTS-STARTPTS,` +
    `silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01,` +
    `areverse,afade=t=in:d=${fx.fade},areverse`;
  const report = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', src, '-af', `${shape},loudnorm=I=${LUFS}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const m = JSON.parse(report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1));
  const out = join(outDir, `${fx.name}.ogg`);
  const norm = `loudnorm=I=${LUFS}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', src, '-af', `${shape},${norm}`, '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '5', out], { stdio: 'ignore' });
  console.log(`${fx.name}: ${probe(out).toFixed(2)} s, ${m.input_i} → ${LUFS} LUFS, ${(statSync(out).size / 1024).toFixed(0)} KB`);
}
