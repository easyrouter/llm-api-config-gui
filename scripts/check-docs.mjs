/** Offline checks for public entry points. No network requests, keys, or ranking assumptions. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const bilingual = [
  ["README.md", "README.zh-CN.md"],
  ["docs/en/QUICKSTART.md", "docs/QUICKSTART.md"],
  ["docs/en/TROUBLESHOOTING.md", "docs/TROUBLESHOOTING.md"],
  ["docs/en/guides/codex-api-config.md", "docs/guides/codex-api-config.md"],
  ["docs/en/guides/claude-code-api-config.md", "docs/guides/claude-code-api-config.md"],
  ["docs/en/guides/base-url-api-key.md", "docs/guides/base-url-api-key.md"],
];
const docs = [
  ...bilingual.flat(),
  "README.en.md",
  "SECURITY.md",
  "docs/README.md",
  "docs/PROJECT-FACTS.md",
];
const canonical = "https://github.com/easyrouter/seedrouter-api-setup";
const errors = [];
const links = new Map();
for (const file of docs) {
  const text = readFileSync(file, "utf8");
  if ((text.match(/^# /gm) ?? []).length !== 1) errors.push(`${file}: expected one H1`);
  if (text.includes("https://github.com/easyrouter/llm-api-tutorial"))
    errors.push(`${file}: stale repository URL`);
  const resolved = [];
  // Covers inline links, images, and the outer target of linked badges. Anchors are excluded.
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const path = resolve(dirname(file), target);
    resolved.push(path);
    if (!existsSync(path)) errors.push(`${file}: broken link ${target}`);
  }
  links.set(file, resolved);
}
for (const [en, zh] of bilingual) {
  if (!links.get(en).includes(resolve(zh))) errors.push(`${en}: missing Chinese counterpart link`);
  if (!links.get(zh).includes(resolve(en))) errors.push(`${zh}: missing English counterpart link`);
}
for (const file of ["README.md", "README.zh-CN.md"]) {
  const text = readFileSync(file, "utf8");
  if (!text.includes("https://seedrouter.net/"))
    errors.push(`${file}: missing sponsor destination`);
  if (!text.includes(canonical)) errors.push(`${file}: missing canonical repository URL`);
  if (!text.includes("docs/PROJECT-FACTS.md"))
    errors.push(`${file}: missing evidence/scope reference`);
}
if (!readFileSync("README.md", "utf8").startsWith("# SeedRouter API Setup"))
  errors.push("README.md: expected English project homepage");
if (!readFileSync("README.en.md", "utf8").includes("(README.md)"))
  errors.push("README.en.md: missing compatibility link");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.repository.url !== `${canonical}.git`) errors.push("package.json: repository mismatch");
if (!readFileSync("src-tauri/Cargo.toml", "utf8").includes(`repository = "${canonical}"`))
  errors.push("Cargo.toml: repository mismatch");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Checked ${docs.length} public documents: H1s, local targets, language pairs, canonical repository, and manifests OK.`,
  );
