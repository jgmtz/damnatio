// Converts the author's downloads (originais/audio) into game loops (assets/audio/music/<slug>.ogg).
// - start/end cut the silence, fade-in and fade-out; `xfade` > 0 blends the tail into the head so the
//   loop has no seam (tracks already made as loops keep xfade 0).
// - Two-pass loudnorm (linear) to `lufs`.
// Usage: node tools/music.mjs [slug...]   (needs ffmpeg on the PATH)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const only = process.argv.slice(2);
const tmp = join(process.env.TEMP ?? '.', 'damnatio-music');
mkdirSync(tmp, { recursive: true });
mkdirSync(join(root, 'assets/audio/music'), { recursive: true });

const TRACKS = [
  { slug: 'mystic_journey', src: 'mystic_journey.mp3', start: 0, end: 226.5, xfade: 3, lufs: -18 },
  { slug: 'soft_harp', src: 'Harp.mp3', start: 0.0236, end: null, xfade: 0, lufs: -18 },
  { slug: 'walking_with_poseidon', src: '(2) walking_with_poseidon.mp3', start: 2.5, end: 41.2, xfade: 1.5, lufs: -18 },
  { slug: 'dark_ambience', src: 'Iwan Gabovitch - Dark Ambience Loop.ogg', start: 0, end: null, xfade: 0, lufs: -21 },
  { slug: 'cave_theme', src: 'cave themeb4.ogg', start: 5, end: 264, xfade: 4, lufs: -21 },
  { slug: 'evil_temple', src: 'evil_temple.ogg', start: 0, end: null, xfade: 0, lufs: -21 },
  { slug: 'find_nothing', src: 'Find Nothing.mp3', start: 4, end: 137.5, xfade: 3, lufs: -21 },
  { slug: 'old_tower_inn', src: 'Loop_The_Old_Tower_Inn.wav', start: 0, end: null, xfade: 0, lufs: -18 },
  { slug: 'bards_tale', src: 'Loop_The_Bards_Tale.wav', start: 0, end: null, xfade: 0, lufs: -18 },
  { slug: 'minstrel_dance', src: 'Loop_Minstrel_Dance.wav', start: 0, end: null, xfade: 0, lufs: -18 },
  { slug: 'port_night', src: 'port_night.mp3', start: 0.0287, end: null, xfade: 0, lufs: -18 },
  // Pieces with a beginning and an end (loop: false in audio.json): no blend, only the silence cut.
  // A solo voice sounds louder than instruments at the same LUFS: kept lower (author found -18 too loud).
  { slug: 'iante', src: 'iante.ogg', start: 1.2, end: 174.25, xfade: 0, lufs: -23 },
  { slug: 'coda', src: 'coda.mp3', start: 0, end: null, xfade: 0, lufs: -18 },
  { slug: 'secret_sanctum', src: 'Viktor Kraus - Secret Sanctum.mp3', start: 1, end: 367, xfade: 3, lufs: -21 },
];

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
const ffErr = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr;

for (const t of TRACKS) {
  if (only.length && !only.includes(t.slug)) continue;
  const src = join(root, 'originais/audio', t.src);
  const loop = join(tmp, `${t.slug}.wav`);
  const trim = `atrim=start=${t.start}${t.end ? `:end=${t.end}` : ''},asetpts=PTS-STARTPTS`;
  const graph = t.xfade > 0
    ? `[0:a]${trim},asplit=2[a][b];[b]atrim=end=${t.xfade},asetpts=PTS-STARTPTS[h];` +
      `[a][h]acrossfade=d=${t.xfade}:c1=qsin:c2=qsin,atrim=start=${t.xfade},asetpts=PTS-STARTPTS[out]`
    : `[0:a]${trim}[out]`;
  ff(['-i', src, '-filter_complex', graph, '-map', '[out]', '-ar', '44100', '-ac', '2', '-c:a', 'pcm_f32le', loop]);

  // Pass 1: measure.
  const report = ffErr(['-i', loop, '-af', `loudnorm=I=${t.lufs}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = JSON.parse(report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1));
  // Pass 2: apply (linear when the peak allows it).
  const out = join(root, 'assets/audio/music', `${t.slug}.ogg`);
  const norm = `loudnorm=I=${t.lufs}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  ff(['-i', loop, '-af', norm, '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4', out]);
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], { encoding: 'utf8' }).trim();
  console.log(`${t.slug}: in ${m.input_i} LUFS -> ${t.lufs}, ${Number(dur).toFixed(1)} s, ${(statSync(out).size / 1e6).toFixed(1)} MB`);
}


