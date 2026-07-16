const { app } = require("electron");
const path = require("path");
const { mkdirSync } = require("fs");
const fs = require("fs/promises");
const crypto = require("crypto");

function getCacheDir() {
  const dir = path.join(app.getPath("userData"), "icon_cache");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function getIconFromExecutable(exePath, size = "normal") {
  if (!exePath) return null;
  try { await fs.access(exePath); } catch { return null; }

  const cacheDir = getCacheDir();
  const cached = path.join(cacheDir, `${crypto.createHash("md5").update(exePath).digest("hex")}_${size}.png`);

  try { return await fs.readFile(cached); } catch { /* cache miss */ }

  try {
    const img = await app.getFileIcon(exePath, { size });
    const buf = img.toPNG();
    if (!buf?.length) return null;
    fs.writeFile(cached, buf).catch((e) => console.error("[iconUtils] Cache write failed:", e));
    return buf;
  } catch (e) {
    console.error("[iconUtils] Extraction failed:", exePath, e);
    return null;
  }
}

async function getIconForExe(exePath) {
  try { return exePath ? await getIconFromExecutable(exePath) : null; }
  catch (e) { console.error("[iconUtils] getIconForExe:", e); return null; }
}

async function getIconForPid(pid) {
  try {
    const psList = await import("ps-list");
    const proc = (await psList.default()).find((p) => p.pid === pid);
    return proc?.path ? await getIconFromExecutable(proc.path) : null;
  } catch (e) {
    console.error("[iconUtils] getIconForPid:", e);
    return null;
  }
}

async function clearIconCache() {
  try {
    const dir = getCacheDir();
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".png"));
    await Promise.all(files.map((f) => fs.unlink(path.join(dir, f))));
    return true;
  } catch (e) {
    console.error("[iconUtils] Clear cache failed:", e);
    return false;
  }
}

async function getCacheStats() {
  try {
    const dir = getCacheDir();
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".png"));
    let totalSize = 0;
    for (const f of files) {
      try { totalSize += (await fs.stat(path.join(dir, f))).size; } catch { /* skip */ }
    }
    return { totalIcons: files.length, totalSize, totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2) };
  } catch {
    return { totalIcons: 0, totalSize: 0, totalSizeMB: "0.00" };
  }
}

module.exports = { getIconFromExecutable, getIconForExe, getIconForPid, clearIconCache, getCacheStats };
