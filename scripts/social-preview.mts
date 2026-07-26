import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(rootDir, "docs", "screenshots");
const source = path.join(outDir, "today.png");

let shot: string;
try {
  shot = (await readFile(source)).toString("base64");
} catch {
  console.error(
    `Missing ${path.relative(rootDir, source)}. Run npm run screenshots first.`,
  );
  process.exit(1);
}

const html = `
<!doctype html>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1280px;
    height: 640px;
    display: flex;
    align-items: center;
    gap: 56px;
    padding: 0 0 0 72px;
    overflow: hidden;
    background: #4a154b;
    background-image:
      radial-gradient(120% 90% at 0% 0%, #611f69 0%, rgba(97, 31, 105, 0) 55%),
      radial-gradient(90% 70% at 100% 100%, #592466 0%, rgba(89, 36, 102, 0) 60%);
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    color: #ffffff;
    -webkit-font-smoothing: antialiased;
  }
  .copy { width: 560px; flex: none; }
  .eyebrow {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: #d9bdde;
    margin-bottom: 22px;
  }
  h1 {
    font-size: 62px;
    font-weight: 800;
    line-height: 1.04;
    letter-spacing: -1.4px;
    margin-bottom: 22px;
  }
  h1 em { font-style: normal; color: #f4ede4; }
  p {
    font-size: 21px;
    line-height: 1.5;
    color: #e8d7ec;
    margin-bottom: 32px;
  }
  .stats { display: flex; gap: 14px; flex-wrap: wrap; }
  .stat {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 9px 18px;
    border-radius: 90px;
    border: 1px solid #592466;
    background: rgba(255, 255, 255, 0.07);
    color: #f9f0ff;
  }
  .shot {
    flex: none;
    width: 720px;
    border-radius: 14px;
    border: 1px solid #592466;
    box-shadow: 0 40px 90px rgba(0, 0, 0, 0.45);
    transform: perspective(1800px) rotateY(-13deg) rotateX(3deg) scale(1.02);
    transform-origin: left center;
  }
</style>
<div class="copy">
  <div class="eyebrow">AI-powered job search</div>
  <h1>Job<em>Tracker</em></h1>
  <p>Analyzes job descriptions, ranks your resumes with pgvector, and tailors your bullets — measured with a real eval harness.</p>
  <div class="stats">
    <span class="stat">4 AI features</span>
    <span class="stat">215 tests</span>
    <span class="stat">94% F1 on JD analysis</span>
    <span class="stat">Next.js 16 · Gemini · Postgres</span>
  </div>
</div>
<img class="shot" src="data:image/png;base64,${shot}" alt="" />
`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 640 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.screenshot({ path: path.join(outDir, "social-preview.png") });
await browser.close();

console.log("✓ social-preview.png (1280×640)");
console.log(
  "Upload at: Settings → General → Social preview → Edit → Upload an image",
);
