// src/utils/readVersionFile.ts

const fs = require("fs");
const path = require("path");

// Get the path relative to the current file's location
const versionPath = path.join(__dirname, "..", "..", "version.txt");

console.log("versionPath: ", versionPath);

function readVersionFile(): string {
  try {
    const version = fs.readFileSync(versionPath, "utf8").trim();
    console.info(`[INFO] Successfully loaded version: ${version}`);
    return version;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.warn("[WARNING] version.txt not found, returning 'unknown'");
    } else {
      console.error(`[ERROR] Failed to read version.txt: ${err}`);
    }
    return "unknown";
  }
}

export const VERSION: string = readVersionFile();
