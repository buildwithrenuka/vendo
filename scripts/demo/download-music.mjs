/**
 * Background music for demo video — Pixabay download with ffmpeg fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "bg-music.mp3");

const CANDIDATES = [
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb7499132.mp3",
  "https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7693a.mp3",
];

function runFfmpeg(args) {
  const bin = ffmpegPath ?? "ffmpeg";
  return spawnSync(bin, args, { stdio: "pipe", encoding: "utf8" }).status === 0;
}

/** Generate a soft ambient pad — no copyright issues */
function generateAmbientMusic(outPath) {
  if (!ffmpegPath) return false;
  console.log("Generating ambient background track with ffmpeg…");
  return runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=196:duration=100:sample_rate=44100",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=246.94:duration=100:sample_rate=44100",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=329.63:duration=100:sample_rate=44100",
    "-f",
    "lavfi",
    "-i",
    "anoisesrc=d=100:c=brown:a=0.003",
    "-filter_complex",
    [
      "[0:a]volume=0.035[a0]",
      "[1:a]volume=0.028[a1]",
      "[2:a]volume=0.022[a2]",
      "[3:a]lowpass=f=500,volume=0.06[a3]",
      "[a0][a1][a2][a3]amix=inputs=4:duration=first",
      "afade=t=in:st=0:d=3",
      "afade=t=out:st=92:d=6",
      "volume=0.85",
    ].join(","),
    "-c:a",
    "libmp3lame",
    "-b:a",
    "192k",
    outPath,
  ]);
}

async function tryDownload(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; JalDemo/1.0)" },
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 50_000) return false;
  fs.writeFileSync(OUT, buf);
  return true;
}

export async function ensureDemoMusic() {
  if (fs.existsSync(OUT) && fs.statSync(OUT).size > 50_000) {
    return OUT;
  }

  for (const url of CANDIDATES) {
    console.log("Trying music download…");
    try {
      if (await tryDownload(url)) {
        console.log(`✓ Music downloaded: ${OUT}`);
        return OUT;
      }
    } catch {
      /* next */
    }
  }

  if (generateAmbientMusic(OUT)) {
    console.log(`✓ Music generated: ${OUT}`);
    return OUT;
  }

  throw new Error("Could not download or generate background music");
}

if (process.argv[1]?.endsWith("download-music.mjs")) {
  ensureDemoMusic().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
