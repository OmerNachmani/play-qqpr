#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";
import https from "https";

function usage(exitCode = 0) {
  console.log(`
play-qqpr — play QQPR animated ASCII art in your terminal

Usage:
  play-qqpr <id> [--fps N] [--loop N] [--cache-dir PATH] [--no-download]
  play-qqpr --random [--fps N] [--loop N]
  play-qqpr --list
  play-qqpr --info <id>
  play-qqpr --clear-cache

Options:
  --fps N         Frames per second (default: 10)
  --loop N        Loop N times then exit (default: infinite)
  --random        Play a random animation from cache
  --info <id>     Show info about a cached animation
  --no-download   Only play if already cached
  --list          List cached animation IDs
  --clear-cache   Delete all cached animations

Examples:
  play-qqpr 1000
  play-qqpr 1044 --fps 12 --loop 3
  play-qqpr --random
  play-qqpr --info 1044
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { fps: 10, loop: 0, noDownload: false, list: false, clear: false, random: false, info: false, id: null, cacheDir: null };
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage(0);
    else if (a === "--fps") args.fps = Number(argv[++i] ?? NaN);
    else if (a === "--loop") args.loop = Number(argv[++i] ?? NaN);
    else if (a === "--cache-dir") args.cacheDir = argv[++i];
    else if (a === "--no-download") args.noDownload = true;
    else if (a === "--list") args.list = true;
    else if (a === "--clear-cache") args.clear = true;
    else if (a === "--random") args.random = true;
    else if (a === "--info") args.info = true;
    else rest.push(a);
  }

  if (!Number.isFinite(args.fps) || args.fps <= 0) {
    console.error("Invalid --fps value");
    usage(1);
  }

  if (args.loop !== 0 && (!Number.isFinite(args.loop) || args.loop < 0)) {
    console.error("Invalid --loop value (must be a positive integer)");
    usage(1);
  }

  if (rest.length > 0) args.id = rest[0];
  return args;
}

function defaultCacheDir() {
  const xdg = process.env.XDG_CACHE_HOME;
  const home = os.homedir();
  const base = xdg || path.join(home, ".cache");
  return path.join(base, "play-qqpr");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function htmlToText(s) {
  return s
    .replace(/\r/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function unescapeJsString(s) {
  return s
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function extractFrames(code) {
  // Common QQPR format: a[0] = "....<br>...."
  const re = /([A-Za-z_$][\w$]*)\s*\[\s*(\d+)\s*\]\s*=\s*(["'])([\s\S]*?)\3/g;
  const frames = new Map();

  for (const m of code.matchAll(re)) {
    const idx = Number(m[2]);
    const raw = m[4];

    // heuristic: frames are "big" and contain <br> or \n
    if (raw.length < 50) continue;
    if (!raw.includes("<br") && !raw.includes("\\n")) continue;

    frames.set(idx, htmlToText(unescapeJsString(raw)));
  }

  if (frames.size < 2) return null;

  return [...frames.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v)
    .map(f => f.replace(/[ \t]+\n/g, "\n").replace(/\n+$/g, "\n"));
}

function httpGetFollow(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "play-qqpr" } }, (res) => {
      const code = res.statusCode ?? 0;

      // Redirect?
      if ([301, 302, 303, 307, 308].includes(code) && res.headers.location && maxRedirects > 0) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        resolve(httpGetFollow(next, maxRedirects - 1));
        return;
      }

      if (code !== 200) {
        res.resume();
        reject(new Error(`HTTP ${code} for ${url}`));
        return;
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
  });
}

async function downloadToFile(url, filepath) {
  const data = await httpGetFollow(url);
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, data, "utf8");
}

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

function hideCursor() {
  process.stdout.write("\x1b[?25l");
}

function showCursor() {
  process.stdout.write("\x1b[?25h");
}

function getCachedIds(cacheDir) {
  try {
    return fs.readdirSync(cacheDir).filter(x => x.endsWith(".js")).map(x => x.replace(/\.js$/, ""));
  } catch {
    return [];
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const cacheDir = a.cacheDir || defaultCacheDir();
  ensureDir(cacheDir);

  if (a.list) {
    const items = getCachedIds(cacheDir);
    if (items.length === 0) console.log("(cache empty)");
    else console.log(items.sort((x, y) => Number(x) - Number(y)).join("\n"));
    return;
  }

  if (a.clear) {
    for (const f of fs.readdirSync(cacheDir)) {
      if (f.endsWith(".js")) fs.unlinkSync(path.join(cacheDir, f));
    }
    console.log(`Cleared cache: ${cacheDir}`);
    return;
  }

  // Handle --random: pick a random cached animation
  if (a.random) {
    const items = getCachedIds(cacheDir);
    if (items.length === 0) {
      console.error("No cached animations. Download some first with: play-qqpr <id>");
      process.exit(1);
    }
    a.id = items[Math.floor(Math.random() * items.length)];
    a.noDownload = true; // already cached
  }

  // Handle --info: show animation metadata
  if (a.info) {
    if (!a.id) {
      console.error("--info requires an animation ID");
      usage(1);
    }
    const id = String(a.id).trim();
    const file = path.join(cacheDir, `${id}.js`);
    if (!fs.existsSync(file)) {
      console.error(`Animation ${id} not in cache. Download it first.`);
      process.exit(1);
    }
    const src = fs.readFileSync(file, "utf8");
    const frames = extractFrames(src);
    if (!frames) {
      console.error("Could not extract frames from this animation.");
      process.exit(1);
    }
    const duration = (frames.length / a.fps).toFixed(1);
    console.log(`Animation ID: ${id}`);
    console.log(`Frames: ${frames.length}`);
    console.log(`Duration at ${a.fps} fps: ${duration}s per loop`);
    console.log(`Cache file: ${file}`);
    return;
  }

  if (!a.id) usage(1);

  const id = String(a.id).trim();
  if (!/^\d+$/.test(id)) {
    console.error("ID must be numeric (e.g. 1000, 1044)");
    process.exit(1);
  }

  const file = path.join(cacheDir, `${id}.js`);
  const url = `https://www.qqpr.com/ascii/js/${id}.js`;

  if (!fs.existsSync(file)) {
    if (a.noDownload) {
      console.error(`Not in cache and --no-download set: ${file}`);
      process.exit(1);
    }
    console.log(`Downloading ${id}...`);
    await downloadToFile(url, file);
  }

  const src = fs.readFileSync(file, "utf8");
  const frames = extractFrames(src);
  if (!frames) {
    console.error("Could not extract frames from this animation ID.");
    process.exit(1);
  }

  let frameIndex = 0;
  let loopCount = 0;
  const maxLoops = a.loop > 0 ? a.loop : Infinity;

  hideCursor();

  const cleanup = () => {
    clearInterval(timer);
    clearScreen();
    showCursor();
    process.exit(0);
  };

  const timer = setInterval(() => {
    clearScreen();
    process.stdout.write(frames[frameIndex]);
    frameIndex++;
    
    if (frameIndex >= frames.length) {
      frameIndex = 0;
      loopCount++;
      if (loopCount >= maxLoops) {
        cleanup();
      }
    }
  }, 1000 / a.fps);

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  clearScreen();
  process.stdout.write(frames[0]);
}

main().catch((e) => {
  console.error("Error:", e?.message ?? e);
  process.exit(1);
});
