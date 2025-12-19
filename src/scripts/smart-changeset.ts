#!/usr/bin/env ts-node

import { exec, execSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";

// Get changed files since the last Git tag
function getChangedFiles(): string[] {
  try {
    const lastTag = execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim();
    const output = execSync(`git diff --name-only ${lastTag}`, { encoding: "utf-8" });
    return output.split("\n").filter(Boolean);
  } catch (e) {
    console.warn("⚠️ No tags found. Checking full history.");
    const output = execSync("git ls-files", { encoding: "utf-8" });
    return output.split("\n").filter(Boolean);
  }
}

// Create a changeset file
function createChangesetFile(impact: string, summary: string, pkgName: string): string {
  const slug = `${Math.random().toString(36).substring(2, 8)}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
  const content = `---
"${pkgName}": ${impact}
---

${summary}
`;
  const dir = path.join(process.cwd(), ".changeset");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const file = path.join(dir, `${slug}.md`);
  fs.writeFileSync(file, content);
  console.log(`✅ Created: .changeset/${slug}.md`);
  return file;
}

async function run() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log("✅ No changed files since last tag.");
    return;
  }

  console.log("📂 Files changed since last tag:\n");
  changedFiles.forEach(f => console.log("  •", f));
  console.log();

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8")).name;

  const { impact, summary, openFile } = await inquirer.prompt([
    {
      type: "list",
      name: "impact",
      message: `What type of version bump for ${pkg}?`,
      choices: ["patch", "minor", "major"],
      default: "patch",
    },
    {
      type: "input",
      name: "summary",
      message: "Write a summary for the changelog:",
    },
    {
      type: "confirm",
      name: "openFile",
      message: "Open the changeset file in your editor now?",
      default: false,
    },
  ]);

  const filePath = createChangesetFile(impact, summary, pkg);

  if (openFile) {
    exec(`open "${filePath}"`);
  }
}

run();
