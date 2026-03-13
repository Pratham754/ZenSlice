const { app } = require("electron");
const path = require("path");
const { mkdirSync } = require("fs");
const fsPromises = require("fs/promises");
const crypto = require("crypto");

// Get a writable cache directory
function getCacheDir() {
    const cacheDir = path.join(app.getPath("userData"), "icon_cache");
    mkdirSync(cacheDir, { recursive: true });
    return cacheDir;
}

/**
 * Extracts the icon from the executable path natively via Electron.
 */
async function getIconFromExecutable(exePath, size = "normal") {
    if (!exePath) {
        return null;
    }

    // Check if file exists
    try {
        await fsPromises.access(exePath);
    } catch {
        return null;
    }

    const cacheDir = getCacheDir();
    const hashName = crypto.createHash("md5").update(exePath).digest("hex");
    const cachedPath = path.join(cacheDir, `${hashName}_${size}.png`);

    // Return cached icon if it exists
    try {
        return await fsPromises.readFile(cachedPath);
    } catch (error) {
        // Cache miss, proceed to extract natively
    }

    try {
        // Native Electron API call
        const nativeImage = await app.getFileIcon(exePath, { size });
        const pngBuffer = nativeImage.toPNG();

        if (!pngBuffer || pngBuffer.length === 0) {
            return null;
        }

        // Save the new icon to the cache
        try {
            await fsPromises.writeFile(cachedPath, pngBuffer);
        } catch (writeError) {
            console.error(`[iconUtils] Failed to cache icon: ${writeError}`);
        }

        return pngBuffer;
    } catch (error) {
        console.error(`[iconUtils] Native extraction failed for ${exePath}: ${error}`);
        return null;
    }
}

async function getIconForExe(exePath) {
    try {
        if (exePath) {
            return await getIconFromExecutable(exePath);
        }
    } catch (error) {
        console.error(`[iconUtils] Error getting icon for EXE ${exePath}: ${error}`);
    }
    return null;
}

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

async function clearIconCache() {
    try {
        const cacheDir = getCacheDir();
        const files = await fsPromises.readdir(cacheDir);
        const pngFiles = files.filter((file) => file.endsWith(".png"));

        await Promise.all(
            pngFiles.map((file) => fsPromises.unlink(path.join(cacheDir, file)))
        );

        return true;
    } catch (error) {
        console.error("[iconUtils] Failed to clear icon cache:", error);
        return false;
    }
}

async function getCacheStats() {
    try {
        const cacheDir = getCacheDir();
        const files = await fsPromises.readdir(cacheDir);
        const pngFiles = files.filter((file) => file.endsWith(".png"));

        let totalSize = 0;
        for (const file of pngFiles) {
            try {
                const stats = await fsPromises.stat(path.join(cacheDir, file));
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