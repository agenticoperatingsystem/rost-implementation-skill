#!/usr/bin/env node
// Regenerates the skill-manifest.json files array: discovers tracked content
// files, computes each sha256, and rewrites the manifest in place. All other
// manifest fields are preserved. Usage: node scripts/update-manifest.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "skill-manifest.json");

const ROOT_FILES = ["SKILL.md", "README.md", "CHANGELOG.md", "LICENSE"];
const DIRS = ["references", "scripts", "fixtures", ".github/workflows"];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const paths = [
  ...ROOT_FILES.map((f) => join(root, f)),
  ...DIRS.flatMap((d) => walk(join(root, d))),
]
  .map((p) => relative(root, p))
  .sort();

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.files = paths.map((path) => {
  const sha256 = createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
  console.log(`${sha256}  ${path}`);
  return { path, sha256 };
});

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${manifest.files.length} file entries to skill-manifest.json`);
