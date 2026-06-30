/**
 * 2-minute cinematic Jal hackathon demo recorder.
 * Usage: npm run demo:record
 * Then:  npm run demo:music  (Dai Dai or custom YouTube track)
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEMO = path.join(__dirname, "demo");
const OUT_DIR = path.join(ROOT, "demo-output");
const YOUTUBE_MP3 = path.join(DEMO, "youtube-music.mp3");

const BASE_URL =
  process.env.JAL_DEMO_URL ?? "https://vendo-api.renuka-khirwadkarr.workers.dev";

const VIEWPORT = { width: 1920, height: 1080 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fileUrl(absPath) {
  return `file:///${absPath.replace(/\\/g, "/")}`;
}

function scene(name) {
  return fileUrl(path.join(DEMO, `scene.html?s=${name}`));
}

function runFfmpeg(args) {
  const bin = ffmpegPath ?? "ffmpeg";
  return spawnSync(bin, args, { stdio: "inherit", encoding: "utf8" }).status === 0;
}

async function smoothScroll(page, targetY, durationMs = 2200) {
  await page.evaluate(
    async ({ targetY, durationMs }) => {
      const start = window.scrollY;
      const delta = targetY - start;
      const t0 = performance.now();
      await new Promise((resolve) => {
        function frame(t) {
          const p = Math.min(1, (t - t0) / durationMs);
          const ease = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
          window.scrollTo(0, start + delta * ease);
          if (p < 1) requestAnimationFrame(frame);
          else resolve(undefined);
        }
        requestAnimationFrame(frame);
      });
    },
    { targetY, durationMs },
  );
}

async function scrollToSelector(page, selector, offset = -100, durationMs = 2400) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 25_000 });
  const box = await el.boundingBox();
  if (box) await smoothScroll(page, Math.max(0, box.y + offset), durationMs);
}

async function panHero(page) {
  await page.mouse.move(960, 500);
  await sleep(400);
  await smoothScroll(page, 280, 3500);
  await sleep(1200);
  await smoothScroll(page, 0, 2000);
  await sleep(800);
}

async function typeSlow(page, locator, text) {
  await locator.click();
  for (const ch of text) {
    await locator.pressSequentially(ch, { delay: 55 });
  }
}

function muxMusic(silentMp4, musicPath, finalMp4) {
  console.log("\nMixing background music…");
  return runFfmpeg([
    "-y", "-i", silentMp4, "-stream_loop", "-1", "-i", musicPath,
    "-filter_complex", "[1:a]volume=0.22,afade=t=in:st=0:d=3[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart", finalMp4,
  ]);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Recording 2-min cinematic demo → ${OUT_DIR}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    colorScheme: "dark",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(35_000);

  // ── 0:00 Intro (6s) ──
  await page.goto(fileUrl(path.join(DEMO, "intro.html")));
  await sleep(6000);

  // ── 0:06 Hero cinematic pan (14s) ──
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(1500);
  await panHero(page);

  // ── 0:20 Scene: Feedback River (4s) ──
  await page.goto(scene("river"));
  await sleep(4000);

  // ── 0:24 River — all droplets (24s) ──
  await page.goto(`${BASE_URL}/#river`, { waitUntil: "networkidle" });
  await sleep(1500);
  const droplets = page.locator(".river-showcase-droplet");
  const n = await droplets.count();
  for (let i = 0; i < n; i++) {
    await droplets.nth(i).click();
    await sleep(i === 2 || i === 3 ? 4500 : 3500);
  }

  // ── 0:48 Scene: Dual Lens (3.5s) ──
  await page.goto(scene("lens"));
  await sleep(3500);

  // ── 0:52 Scene: PR (3.5s) ──
  await page.goto(scene("pr"));
  await sleep(3500);

  // ── 0:55 PR pipeline cinematic (~42s) ──
  await page.goto(fileUrl(path.join(DEMO, "pr-pipeline.html")));
  await sleep(42_000);

  // ── 1:37 Scene: Studio (3.5s) ──
  await page.goto(scene("studio"));
  await sleep(3500);

  // ── 1:41 Studio onboard (14s) ──
  await page.goto(`${BASE_URL}/studio/onboard`, { waitUntil: "networkidle" });
  await sleep(2000);
  const inputs = page.locator("input");
  const repoInput = inputs.filter({ has: page.locator("xpath=..") }).nth(1);
  if ((await inputs.count()) >= 2) {
    await typeSlow(page, inputs.nth(1), "buildwithrenuka/vendo");
    await sleep(2500);
  }
  await smoothScroll(page, 200, 1500);
  await sleep(3500);

  // ── 1:55 #try judges section (10s) ──
  await page.goto(`${BASE_URL}/#try`, { waitUntil: "networkidle" });
  await sleep(2000);
  const cards = page.locator(".judge-try-card");
  if ((await cards.count()) >= 2) {
    await cards.nth(0).hover();
    await sleep(1500);
    await cards.nth(1).hover();
    await sleep(1500);
    await cards.nth(2).hover();
    await sleep(2000);
  }

  // ── 2:05 Docs (8s) ──
  await page.goto(`${BASE_URL}/docs`, { waitUntil: "networkidle" });
  await sleep(2000);
  await smoothScroll(page, 500, 2000);
  await sleep(2500);
  await smoothScroll(page, 1000, 1800);
  await sleep(1500);

  // ── 2:13 Scene: Ship (3.5s) ──
  await page.goto(scene("ship"));
  await sleep(3500);

  // ── 2:17 Outro (7s) ──
  await page.goto(fileUrl(path.join(DEMO, "outro.html")));
  await sleep(7000);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    console.error("No video recorded.");
    process.exit(1);
  }

  const rawPath = await video.path();
  const silentWebm = path.join(OUT_DIR, "jal-hackathon-demo-silent.webm");
  const silentMp4 = path.join(OUT_DIR, "jal-hackathon-demo-silent.mp4");
  const finalMp4 = path.join(OUT_DIR, "jal-hackathon-demo.mp4");

  if (rawPath !== silentWebm) fs.renameSync(rawPath, silentWebm);
  console.log(`\n✓ Silent video: ${silentWebm}`);

  if (ffmpegPath) {
    runFfmpeg([
      "-y", "-i", silentWebm, "-c:v", "libx264", "-preset", "fast", "-crf", "20",
      "-pix_fmt", "yuv420p", "-an", silentMp4,
    ]);
  }

  const musicPath = fs.existsSync(YOUTUBE_MP3)
    ? YOUTUBE_MP3
    : fs.existsSync(path.join(DEMO, "bg-music.mp3"))
      ? path.join(DEMO, "bg-music.mp3")
      : null;

  if (musicPath && fs.existsSync(silentMp4)) {
    if (muxMusic(silentMp4, musicPath, finalMp4)) {
      console.log(`✓ Final (with music): ${finalMp4}`);
    }
  } else if (fs.existsSync(silentMp4)) {
    fs.copyFileSync(silentMp4, finalMp4);
    console.log(`✓ Final (no music): ${finalMp4}`);
    console.log("  Tip: npm run demo:music  to add Dai Dai track");
  }

  console.log("\nDone — ~2 min cinematic demo ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
