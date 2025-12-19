#!/usr/bin/env ts-node

import { spawnSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import semver from "semver";

const exec = (cmd: string): string => {
  const result = spawnSync(cmd, {
    encoding: "utf8",
    stdio: "inherit",
    shell: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Command failed: ${cmd}`);
  return result.stdout ? result.stdout.trim() : "";
};

const getLatestTag = (): string | null => {
  try {
    const tags = exec("git tag")
      .split("\n")
      .filter(t => /^v?\d+\.\d+\.\d+$/.test(t));
    return tags.sort((a, b) => semver.rcompare(semver.coerce(a)!, semver.coerce(b)!))[0] || null;
  } catch {
    return null;
  }
};

const getLatestSnapshots = (): string[] => {
  try {
    const tags = exec("git tag")
      .split("\n")
      .filter(t => /-beta\.\d+$/.test(t));
    return tags.sort((a, b) => semver.rcompare(semver.coerce(a)!, semver.coerce(b)!)).slice(0, 5);
  } catch {
    return [];
  }
};

const getPackageVersion = (): string | null => {
  const file = path.resolve("package.json");
  if (!fs.existsSync(file)) return null;
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  return pkg.version;
};

(async () => {
  const version = getPackageVersion();
  const tag = getLatestTag();
  const snapshots = getLatestSnapshots();

  console.log(`📦 Current version: ${version}`);
  console.log(`🏷️  Latest version tag: ${tag}`);
  if (snapshots.length > 0) {
    console.log("📦 Latest beta tags:");
    snapshots.forEach(tag => console.log(`  - ${tag}`));
  }

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to do?",
      choices: [
        { name: "Create Changeset", value: "changeset" },
        { name: "Apply Version Bump", value: "bump" },
        { name: "Publish Snapshot (beta)", value: "snapshot" },
        { name: "Publish Final Release", value: "publish" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);

  if (action === "changeset") {
    exec(`pnpm changeset`);
  }

  if (action === "bump") {
    exec(`pnpm changeset version`);
  }

  if (action === "snapshot") {
    const { label } = await inquirer.prompt([
      {
        type: "input",
        name: "label",
        message: "Snapshot label (e.g. beta, canary)",
        default: "beta",
      },
    ]);
    exec(`pnpm changeset version --snapshot ${label}`);
    console.log(`⚠️ Skipping publish step for snapshot '${label}' (private package)`);
  }

  if (action === "publish") {
    console.log("⚠️ Skipping final publish (private package)");
  }

  if (action === "exit") {
    console.log("👋 Exiting...");
  }
})();
