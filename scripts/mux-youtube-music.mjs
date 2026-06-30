/**
 * Download YouTube audio (yt-dlp) and mux into Jal demo video.
 * Usage:
 *   npm run demo:music
 *   npm run demo:music -- https://youtube.com/watch?v=...
 *   node scripts/mux-youtube-music.mjs --local path/to/song.mp3
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "demo-output");
const DEFAULT_URL = "https://www.youtube.com/watch?v=uTDMVdzIhqQ";
const YTDLP = path.join(__dirname, "bin", "yt-dlp.exe");
const MP3 = path.join(__dirname, "demo", "youtube-music.mp3");
const args = process.argv.slice(2);
const isUi = args[0] === "ui" || args[0] === "--ui";
const urlArg = isUi ? args[1] : args[0];

const PREFIX = isUi ? "jal-ui-demo" : "jal-hackathon-demo";
const silentMp4 = path.join(OUT_DIR, `${PREFIX}-silent.mp4`);
const finalMp4 = path.join(OUT_DIR, `${PREFIX}.mp4`);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.inherit ? "inherit" : "pipe", encoding: "utf8", ...opts });
  return r;
}

function runFfmpeg(args) {
  return run(ffmpegPath ?? "ffmpeg", args, { inherit: true }).status === 0;
}

function mux(musicFile) {
  console.log("\nMixing music into demo video…");
  return runFfmpeg([
    "-y", "-i", silentMp4, "-stream_loop", "-1", "-i", musicFile,
    "-filter_complex", "[1:a]volume=0.22,afade=t=in:st=0:d=2.5[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart", finalMp4,
  ]);
}

function downloadWithYtdlp(url) {
  if (!fs.existsSync(YTDLP)) {
    console.log("Downloading yt-dlp…");
    fs.mkdirSync(path.dirname(YTDLP), { recursive: true });
    run(
      "powershell",
      [
        "-Command",
        `Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile '${YTDLP.replace(/'/g, "''")}'`,
      ],
      { inherit: true },
    );
  }
  const ffDir = path.dirname(ffmpegPath ?? "");
  const outTpl = path.join(__dirname, "demo", "youtube-music.%(ext)s");
  const r = run(YTDLP, [
    "-x", "--audio-format", "mp3", "--audio-quality", "192K",
    "--ffmpeg-location", ffDir, "-o", outTpl, url,
  ], { inherit: true });
  return r.status === 0 && fs.existsSync(MP3);
}

// ── --local mode ──
if (process.argv[2] === "--local") {
  const musicFile = process.argv[3];
  if (!musicFile || !fs.existsSync(musicFile)) {
    console.error("Usage: node scripts/mux-youtube-music.mjs --local <audio-file>");
    process.exit(1);
  }
  if (!fs.existsSync(silentMp4)) {
    console.error(`Missing ${silentMp4} — run npm run demo:record${isUi ? ":ui" : ""} first`);
    process.exit(1);
  }
  if (!mux(musicFile)) process.exit(1);
  console.log(`\n✓ Done: ${finalMp4}`);
  process.exit(0);
}

// ── YouTube URL mode ──
const url = urlArg ?? DEFAULT_URL;

if (!fs.existsSync(silentMp4)) {
  console.error(`Missing ${silentMp4} — run npm run demo:record${isUi ? ":ui" : ""} first`);
  process.exit(1);
}

console.log(`YouTube → ${url}`);
if (!downloadWithYtdlp(url)) {
  console.error("\nDownload failed. Save MP3 manually and run:");
  console.error("  node scripts/mux-youtube-music.mjs --local scripts/demo/youtube-music.mp3");
  process.exit(1);
}

if (!mux(MP3)) process.exit(1);
console.log(`\n✓ Done: ${finalMp4}`);
console.log("  Track: Shakira, Burna Boy - Dai Dai (or your chosen URL)");
