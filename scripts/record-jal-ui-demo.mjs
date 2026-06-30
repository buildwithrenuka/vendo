/**
 * Jal UI demo — light theme, new landing (2026 refresh).
 * Usage: npm run demo:record:ui
 * Then:  npm run demo:music:ui
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
const PREFIX = "jal-ui-demo";

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

async function scrollToId(page, id, offset = -80, durationMs = 2400) {
  await page.locator(`#${id}`).first().waitFor({ state: "visible", timeout: 25_000 });
  const y = await page.evaluate((elId) => {
    const el = document.getElementById(elId);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, id);
  await smoothScroll(page, Math.max(0, y + offset), durationMs);
}

async function panHero(page) {
  await sleep(1200);
  await smoothScroll(page, 420, 3200);
  await sleep(1000);
  await smoothScroll(page, 0, 1800);
  await sleep(600);
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
  console.log(`Recording Jal UI demo (light) → ${OUT_DIR}/${PREFIX}.mp4`);
  console.log(`Target: ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    colorScheme: "light",
  });

  await context.addInitScript(() => {
    localStorage.setItem("vendo-theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  });

  const page = await context.newPage();
  page.setDefaultTimeout(35_000);

  // Intro
  await page.goto(fileUrl(path.join(DEMO, "intro.html")));
  await sleep(5500);

  // Hero + pipeline device
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(1800);
  await panHero(page);

  await page.goto(scene("river"));
  await sleep(3500);

  // Feedback River
  await page.goto(`${BASE_URL}/#river`, { waitUntil: "networkidle" });
  await sleep(1500);
  const droplets = page.locator(".river-showcase-droplet");
  const n = await droplets.count();
  for (let i = 0; i < n; i++) {
    await droplets.nth(i).click({ force: true, timeout: 10_000 });
    await sleep(i >= 2 ? 4000 : 3200);
  }

  // Pipeline strip
  await scrollToId(page, "pipeline");
  await sleep(3500);

  // PR creation cinematic — AI Build → GitHub PR → Review → Merge
  await page.goto(scene("pr"));
  await sleep(3500);
  await page.goto(fileUrl(path.join(DEMO, "pr-pipeline.html")));
  await sleep(42_000);

  await page.goto(scene("studio"));
  await sleep(3000);

  // Studio features
  await page.goto(`${BASE_URL}/#studio`, { waitUntil: "networkidle" });
  await sleep(1500);
  await scrollToId(page, "studio");
  await sleep(5000);
  await smoothScroll(page, (await page.evaluate(() => window.scrollY)) + 350, 2000);
  await sleep(3500);

  // Dual path + npm
  await page.goto(`${BASE_URL}/#dual`, { waitUntil: "networkidle" });
  await sleep(1500);
  await scrollToId(page, "dual");
  await sleep(5000);

  // One more thing
  await page.goto(`${BASE_URL}/#one-more-thing`, { waitUntil: "networkidle" });
  await sleep(1500);
  await scrollToId(page, "one-more-thing");
  await sleep(4500);

  // Vendo live demo section
  await page.goto(`${BASE_URL}/#demo`, { waitUntil: "networkidle" });
  await sleep(1500);
  await scrollToId(page, "demo");
  await sleep(4500);

  // Studio onboard
  await page.goto(`${BASE_URL}/studio/onboard`, { waitUntil: "networkidle" });
  await sleep(2000);
  const inputs = page.locator("input");
  if ((await inputs.count()) >= 2) {
    await inputs.nth(1).click();
    await inputs.nth(1).pressSequentially("buildwithrenuka/vendo", { delay: 45 });
    await sleep(3000);
  }
  await smoothScroll(page, 280, 1800);
  await sleep(3500);

  // Judge try
  await page.goto(`${BASE_URL}/#try`, { waitUntil: "networkidle" });
  await sleep(1500);
  const cards = page.locator(".judge-try-card");
  const cardCount = await cards.count();
  for (let i = 0; i < Math.min(cardCount, 3); i++) {
    await cards.nth(i).hover();
    await sleep(1400);
  }

  // Docs
  await page.goto(`${BASE_URL}/docs`, { waitUntil: "networkidle" });
  await sleep(1800);
  await smoothScroll(page, 480, 2000);
  await sleep(2500);

  await page.goto(scene("ship"));
  await sleep(3000);

  await page.goto(fileUrl(path.join(DEMO, "outro.html")));
  await sleep(6500);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    console.error("No video recorded.");
    process.exit(1);
  }

  const rawPath = await video.path();
  const silentWebm = path.join(OUT_DIR, `${PREFIX}-silent.webm`);
  const silentMp4 = path.join(OUT_DIR, `${PREFIX}-silent.mp4`);
  const finalMp4 = path.join(OUT_DIR, `${PREFIX}.mp4`);

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
    console.log("  Tip: npm run demo:music:ui  to add background track");
  }

  console.log("\nDone — Jal UI demo ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
