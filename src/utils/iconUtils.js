const { app } = require("electron");
const path = require("path");
const fs = require("fs/promises"); // Use the promises API for async operations
const crypto = require("crypto");

// Use the dedicated Windows module for icon extraction
const extractFileIcon = require("extract-file-icon");

// Get a writable cache directory
function getCacheDir() {
  const cacheDir = path.join(app.getPath("userData"), "icon_cache");
  // Use a synchronous mkdirSync as it's a one-time operation at startup
  require("fs").mkdirSync(cacheDir, { recursive: true });
  return cacheDir;
}

/**
 * Extracts the icon from the executable path and returns a PNG buffer.
 * Uses caching to avoid redundant extraction. Returns cached result if available.
 */
async function getIconFromExecutable(exePath, size = 32) {
  if (
    !exePath ||
    !(await fs
      .access(exePath)
      .then(() => true)
      .catch(() => false))
  ) {
    console.error(`[iconUtils] Executable not found: ${exePath}`);
    return null;
  }

  // Setup cache directory
  const cacheDir = getCacheDir();

  // Generate a hash for the exePath
  const hashName = crypto.createHash("md5").update(exePath).digest("hex");
  const cachedPath = path.join(cacheDir, `${hashName}_${size}.png`);

  // Return cached icon if it exists
  try {
    const cachedIcon = await fs.readFile(cachedPath);
    return cachedIcon;
  } catch (error) {
    // If reading the file fails, it likely doesn't exist. Proceed to extract.
    console.warn(
      `[iconUtils] Cached icon not found or unreadable. Extracting new icon: ${error.message}`
    );
  }

  try {
    // 💡 Using 'extract-file-icon' here!
    const pngBuffer = await extractFileIcon(exePath, size);

    if (!pngBuffer) {
      console.log(`[iconUtils] No icon found for: ${exePath}`);
      return null;
    }

    // Save the new icon to the cache asynchronously
    try {
      await fs.writeFile(cachedPath, pngBuffer);
    } catch (writeError) {
      console.error(`[iconUtils] Failed to cache icon: ${writeError}`);
    }

    return pngBuffer;
  } catch (error) {
    console.error(
      `[iconUtils] Failed to extract icon from ${exePath}: ${error}`
    );
    return null;
  }
}

/**
 * Wrapper function to get the executable icon buffer for a given path.
 */
async function getIconForExe(exePath) {
  try {
    if (exePath) {
      return await getIconFromExecutable(exePath);
    }
  } catch (error) {
    console.error(
      `[iconUtils] Error getting icon for EXE ${exePath}: ${error}`
    );
  }
  return null;
}

/**
 * Wrapper function to get the executable icon buffer for a given PID.
 */
async function getIconForPid(pid) {
  try {
    const psList = await import("ps-list");
    const processes = await psList.default();
    const process = processes.find((p) => p.pid === pid);

    if (process && process.path) {
      return await getIconFromExecutable(process.path);
    }
  } catch (error) {
    console.error(`[iconUtils] Error getting icon for PID ${pid}: ${error}`);
  }
  return null;
}

/**
 * Clear the icon cache
 */
async function clearIconCache() {
  try {
    const cacheDir = getCacheDir();
    const files = await fs.readdir(cacheDir);
    const pngFiles = files.filter((file) => file.endsWith(".png"));

    await Promise.all(
      pngFiles.map((file) => fs.unlink(path.join(cacheDir, file)))
    );

    console.log("[iconUtils] Icon cache cleared");
    return true;
  } catch (error) {
    console.error("[iconUtils] Failed to clear icon cache:", error);
    return false;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const cacheDir = getCacheDir();
    const files = await fs.readdir(cacheDir);
    const pngFiles = files.filter((file) => file.endsWith(".png"));

    let totalSize = 0;
    for (const file of pngFiles) {
      try {
        const stats = await fs.stat(path.join(cacheDir, file));
        totalSize += stats.size;
      } catch (error) {
        // Skip files that can't be stat'd
      }
    }

    return {
      totalIcons: pngFiles.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error("[iconUtils] Failed to get cache stats:", error);
    return { totalIcons: 0, totalSize: 0, totalSizeMB: "0.00" };
  }
}

module.exports = {
  getIconFromExecutable,
  getIconForExe,
  getIconForPid,
  clearIconCache,
  getCacheStats,
};
