/** Offline checks for public onboarding docs; no network or credentials required. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const docs = [
  "README.md",
  "README.en.md",
  "SECURITY.md",
  "docs/QUICKSTART.md",
  "docs/TROUBLESHOOTING.md",
  "docs/guides/codex-api-config.md",
  "docs/guides/claude-code-api-config.md",
  "docs/guides/base-url-api-key.md",
];
const errors = [];
for (const file of docs) {
  const text = readFileSync(file, "utf8");
  if ((text.match(/^# /gm) ?? []).length !== 1) errors.push(`${file}: expected one H1`);
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    if (!existsSync(resolve(dirname(file), target))) errors.push(`${file}: broken link ${target}`);
  }
}
for (const file of ["README.md", "README.en.md"]) {
  const text = readFileSync(file, "utf8");
  if (!text.includes("https://seedrouter.net/"))
    errors.push(`${file}: missing sponsor destination`);
  if (!text.includes("docs/QUICKSTART.md")) errors.push(`${file}: missing quick-start link`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(`Checked ${docs.length} onboarding documents: headings and local link targets OK.`);
