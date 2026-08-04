#!/usr/bin/env node
// Render dayN/index.html to public/dayN.pdf using headless Chrome's print-to-pdf.
//
//   node tools/pdf/gen_pdfs.mjs day1 day2 day3
//   node tools/pdf/gen_pdfs.mjs            # every dayN/ folder that exists
//
// Needs `npm install` once inside tools/pdf/ (puppeteer-core; not committed).
// Chrome's regular print dialog reflows reveal.js decks badly, so this drives
// Chrome's ?print-pdf export mode instead, which lays out one PDF page per
// slide at the deck's own canvas size.

import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(
    "Could not find a Chrome/Chromium install. Set PUPPETEER_EXECUTABLE_PATH to its binary."
  );
}

async function renderDay(browser, day) {
  const deckPath = path.join(repoRoot, day, "index.html");
  if (!existsSync(deckPath)) {
    console.log(`skip ${day}: no ${day}/index.html`);
    return;
  }
  const url = pathToFileURL(deckPath).href + "?print-pdf";
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => document.documentElement.classList.contains("print-pdf"),
    { timeout: 30000 }
  );

  const size = await page.evaluate(() => {
    const el = document.querySelector(".pdf-page");
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height, pages: document.querySelectorAll(".pdf-page").length };
  });

  const outDir = path.join(repoRoot, "public");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${day}.pdf`);

  await page.pdf({
    path: outPath,
    printBackground: true,
    width: `${size.width}px`,
    height: `${size.height}px`,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await page.close();

  if (errors.length) {
    console.log(`${day}: generated ${outPath} (${size.pages} pages) — with ${errors.length} console error(s):`);
    for (const e of errors) console.log(`  ! ${e}`);
  } else {
    console.log(`${day}: generated ${outPath} (${size.pages} pages)`);
  }
}

async function main() {
  const requested = process.argv.slice(2);
  const days = requested.length
    ? requested
    : ["day1", "day2", "day3", "day4", "day5"].filter((d) => existsSync(path.join(repoRoot, d, "index.html")));

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: "new",
    args: ["--no-sandbox"],
  });

  try {
    for (const day of days) await renderDay(browser, day);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
