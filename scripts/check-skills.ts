#!/usr/bin/env bun
// Validates every routeros-*/SKILL.md beyond what markdownlint/cspell can see:
//   - YAML frontmatter present and parseable (--- ... ---)
//   - `name` and `description` present and non-empty
//   - `name` equals the skill's directory name
//   - `name` <= 64 chars, `description` <= 1024 chars (Anthropic skill-spec limits)
//   - an H1 ("# ...") follows the frontmatter
// Exits non-zero on any failure. CI-safe: no symlink/host-path checks (that's
// `make check`, which only makes sense on a developer machine).

import { Glob } from "bun";

const NAME_MAX = 64;
const DESC_MAX = 1024;

let failures = 0;
const fail = (skill: string, msg: string): void => {
	console.error(`✗ ${skill}: ${msg}`);
	failures++;
};

const unquote = (v: string): string =>
	v.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");

const files = (await Array.fromAsync(new Glob("routeros-*/SKILL.md").scan("."))).sort();

if (files.length === 0) {
	console.error("✗ no routeros-*/SKILL.md files found — run from the repo root");
	process.exit(1);
}

for (const file of files) {
	const dir = file.split("/")[0];
	const text = await Bun.file(file).text();

	const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!fm) {
		fail(dir, "missing or malformed YAML frontmatter (--- ... ---)");
		continue;
	}

	const front = fm[1];
	const body = text.slice(fm[0].length);
	const nameMatch = front.match(/^name:\s*(.+)$/m);
	const descMatch = front.match(/^description:\s*(.+)$/m);

	if (!nameMatch) fail(dir, "frontmatter missing `name:`");
	if (!descMatch) fail(dir, "frontmatter missing `description:`");
	if (!nameMatch || !descMatch) continue;

	const name = unquote(nameMatch[1]);
	const desc = unquote(descMatch[1]);

	if (name !== dir) fail(dir, `name "${name}" does not match directory "${dir}"`);
	if (name.length > NAME_MAX) fail(dir, `name is ${name.length} chars (max ${NAME_MAX})`);
	if (desc.length === 0) fail(dir, "description is empty");
	if (desc.length > DESC_MAX) fail(dir, `description is ${desc.length} chars (max ${DESC_MAX})`);

	const firstLine = body.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
	if (!firstLine.startsWith("# ")) {
		fail(dir, `expected an H1 ("# ...") after frontmatter, found: ${firstLine.slice(0, 60) || "(empty)"}`);
	}
}

if (failures > 0) {
	console.error(`\n${failures} skill validation error(s)`);
	process.exit(1);
}
console.log(`✓ ${files.length} skills valid`);
