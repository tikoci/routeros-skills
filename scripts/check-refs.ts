#!/usr/bin/env bun
// Verifies every `/-path` and property named in the pilot SKILL.md exists in the
// vendored rosetta snapshot (issue #38). CI-safe: reads only the SKILL.md and the
// committed snapshot, never a live export.
//
//   bun scripts/check-refs.ts
//
// Extraction contract (claims are exact tokens with file:line, never fuzzy):
//   1. Path tokens: leading-slash tokens (`/container/add`, REST `${base}/x`),
//      boundary-guarded so `disk1/pull`, `../links`, `100+ MB/s`, and `https://`
//      never match. ID placeholders (`/container/*1`, `/container/${id}`) fold to
//      the parent menu. Never extracted from `text` blocks (file trees).
//   2. Assigns: lowercase `name=` / `name~` tokens (code, prose, tables alike).
//      Uppercase `KEY=value` env examples never match by construction.
//   3. Table cells: names in backticks in header rows, plus first-column body cells
//      only when the header's first cell is "Property" (other tables hold values).
//   4. Dotted fields: `.name` in backticks anywhere, plus `["name"]` / `".name"`
//      indexing in fenced code (REST status fields).
//   5. Bare words: lowercase-hyphenated, digits excluded, in `#` comments of
//      `routeros` blocks only (prose mentions such as activation-timeout).
// Attribution: nearest path in the same fenced block (preceding, else following),
// else nearest preceding path in the document. A claim passes when it exists
// under its attributed menu — a bare menu also tries <menu>/add and <menu>/set —
// or, failing that, anywhere in the skill's owned slice (the SKILL.md states some
// props loosely, e.g. in gotcha bullets). Anything else fails with file:line.
// The allowlists below are explicit, reasoned, and grounded in export probes.

const PILOT_SKILL = "routeros-container";

// FS/container-internal lookalikes documented as examples, not RouterOS paths.
const PATH_DENYLIST = new Map<string, string>([
	["/etc/pihole", "container-internal filesystem example, not a RouterOS path"],
	["/data", "host filesystem path example, not a RouterOS path"],
	["/container/path", "container-internal path placeholder, not a RouterOS path"],
]);

// RouterOS built-ins, inconsistently present per-menu in the export (verified:
// /container/add/name exists but /ip/address/add/name and /container/mounts/add/name
// do not; /container/add/disabled is absent while /ip/address/add/disabled exists).
const UNIVERSAL_PROPS = new Set(["name", "comment", "disabled"]);

// Pre-7.20 name, documented as history; absent from the 7.24.5+ export.
const HISTORICAL_PROPS = new Set(["envlist"]);

// Explicitly documented as not existing ("No .stopped field exists").
const DOCUMENTED_ABSENT = new Set([".stopped"]);

// REST runtime status fields, verified absent from the manual-derived export
// (`running` exists only under unrelated menus; `.running` nowhere).
const OUTPUT_FIELDS = new Set([".running", ".id"]);

let failures = 0;
const fail = (msg: string): void => {
	console.error(`✗ ${msg}`);
	failures++;
};

type Snapshot = {
	paths: Record<string, { type: string; description: string | null; args: Record<string, string | null> }>;
	fields: Record<string, { name: string; kind: string; description: string | null }[]>;
};

type Claim =
	| { kind: "path"; path: string; line: number; raw: string }
	| { kind: "prop"; prop: string; line: number; raw: string; menu: string | null };

const PATH_RE = /\/[A-Za-z][A-Za-z0-9_.${}*-]*(?:\/[A-Za-z0-9_.${}*-]+)*/g;
const PATH_BOUNDARY = /[A-Za-z0-9_.$/-]/;
const ASSIGN_RE = /(^|[^A-Za-z0-9_.$~/-])([a-z][a-z0-9-]*)(=|~)(?![=~>])/g;
const TABLE_CELL_RE = /`([a-z][a-z0-9-]*)`/g;
const DOTTED_QUOTED_RE = /`\.([a-z][a-z0-9-]*)`/g;
const BRACKET_INDEX_RE = /\["([a-z][a-z0-9-]*)"\]|"(\.[a-z][a-z0-9-]*)"/g;
const COMMENT_WORD_RE = /#[^\n]*?([a-z][a-z0-9-]*-[a-z][a-z0-9-]*)/g;

const normalizePath = (raw: string): string | null => {
	const folded = raw
		.replace(/[.,;:!?)]+$/, "")
		.replace(/\/(?:\*[^/]*|\$\{[^}]*\})$/, "");
	if (folded.length < 3) return null;
	return folded;
};

const extract = (file: string, text: string): Claim[] => {
	const claims: Claim[] = [];
	const lines = text.split("\n");
	let inFence: string | null = null;
	// First pass: collect path claims and remember path positions for attribution.
	const pathAtLine = new Map<number, string[]>();
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fence = line.match(/^```(\S*)\s*$/);
		if (fence) {
			inFence = inFence === null ? fence[1] || "plain" : null;
			continue;
		}
		if (i < 3 && (line === "---" || lines[0] === "---")) continue; // frontmatter fence lines
		if (inFence === "text") continue;
		PATH_RE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = PATH_RE.exec(line)) !== null) {
			const start = m.index;
			if (start > 0 && PATH_BOUNDARY.test(line[start - 1])) continue;
			const norm = normalizePath(m[0]);
			if (norm === null) continue;
			claims.push({ kind: "path", path: norm, line: i + 1, raw: m[0] });
			if (PATH_DENYLIST.has(norm)) continue; // documented non-path: no attribution
			pathAtLine.set(i, [...(pathAtLine.get(i) ?? []), norm]);
		}
	}
	// Second pass: prop claims with attribution.
	inFence = null;
	const docPaths: { line: number; path: string }[] = [];
	for (const [ln, ps] of pathAtLine) for (const p of ps) docPaths.push({ line: ln, path: p });
	docPaths.sort((a, b) => a.line - b.line);
	// Table map: header rows contribute names in backticks; body first-column cells
	// contribute only when the table's header first cell is "Property" (other
	// tables hold values, e.g. arch names, in body cells).
	const isTableRow = lines.map((l) => l.trimStart().startsWith("|"));
	const isDelimRow = lines.map((l) => /^\|[\s:|-]+\|\s*$/.test(l.trim()));
	const headerFirstCell = new Map<number, string>();
	for (let t = 0; t < lines.length; t++) {
		if (isTableRow[t] && isDelimRow[t + 1]) {
			const first = (lines[t].split("|")[1] ?? "").replace(/`([^`]*)`/g, "$1").trim();
			let j = t + 2;
			while (j < lines.length && isTableRow[j] && !isDelimRow[j]) {
				headerFirstCell.set(j, first);
				j++;
			}
		}
	}
	const propClaims: { prop: string; line: number; raw: string }[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fence = line.match(/^```(\S*)\s*$/);
		if (fence) {
			inFence = inFence === null ? fence[1] || "plain" : null;
			continue;
		}
		if (i < 3 && (line === "---" || lines[0] === "---")) continue;
		if (inFence === "text") continue;
		const pushProp = (prop: string, raw: string): void => {
			propClaims.push({ prop, line: i + 1, raw });
		};
		if (inFence === null && isTableRow[i]) {
			if (isDelimRow[i + 1]) {
				TABLE_CELL_RE.lastIndex = 0;
				let m: RegExpExecArray | null;
				while ((m = TABLE_CELL_RE.exec(line)) !== null) pushProp(m[1], m[0]);
			} else if (!isDelimRow[i] && headerFirstCell.get(i) === "Property") {
				const firstCell = line.split("|")[1] ?? "";
				TABLE_CELL_RE.lastIndex = 0;
				let m: RegExpExecArray | null;
				while ((m = TABLE_CELL_RE.exec(firstCell)) !== null) pushProp(m[1], m[0]);
			}
		}
		if (inFence !== "sh") {
			ASSIGN_RE.lastIndex = 0;
			let m: RegExpExecArray | null;
			while ((m = ASSIGN_RE.exec(line)) !== null) pushProp(m[2], `${m[2]}${m[3]}`);
		}
		DOTTED_QUOTED_RE.lastIndex = 0;
		let dm: RegExpExecArray | null;
		while ((dm = DOTTED_QUOTED_RE.exec(line)) !== null) pushProp(`.${dm[1]}`, dm[0]);
		if (inFence !== null && inFence !== "text" && inFence !== "sh") {
			BRACKET_INDEX_RE.lastIndex = 0;
			let bm: RegExpExecArray | null;
			while ((bm = BRACKET_INDEX_RE.exec(line)) !== null) {
				pushProp(bm[1] ?? bm[2], bm[0]);
			}
		}
		if (inFence === "routeros" && line.includes("#")) {
			COMMENT_WORD_RE.lastIndex = 0;
			let cm: RegExpExecArray | null;
			while ((cm = COMMENT_WORD_RE.exec(line)) !== null) {
				if (!/[0-9]/.test(cm[1])) pushProp(cm[1], cm[1]);
			}
		}
	}
	// Attribute each prop claim.
	const blockOf = (lineNo: number): { line: number; path: string }[] => {
		// Re-derive the fenced block containing lineNo by scanning fences.
		let fence: string | null = null;
		let start = 0;
		for (let i = 0; i < lines.length; i++) {
			const fm = lines[i].match(/^```(\S*)\s*$/);
			if (fm) {
				if (fence === null) {
					fence = fm[1] || "plain";
					start = i;
				} else {
					if (lineNo - 1 > start && lineNo - 1 < i) {
						const out: { line: number; path: string }[] = [];
						for (let j = start + 1; j < i; j++) {
							for (const p of pathAtLine.get(j) ?? []) out.push({ line: j, path: p });
						}
						return out;
					}
					fence = null;
				}
			}
		}
		return [];
	};
	for (const pc of propClaims) {
		const inBlock = blockOf(pc.line);
		let menu: string | null = null;
		const preceding = inBlock.filter((b) => b.line < pc.line - 1);
		if (preceding.length > 0) menu = preceding[preceding.length - 1].path;
		else if (inBlock.length > 0) menu = inBlock[0].path;
		else {
			const docPre = docPaths.filter((d) => d.line < pc.line - 1);
			if (docPre.length > 0) menu = docPre[docPre.length - 1].path;
		}
		claims.push({ kind: "prop", prop: pc.prop, line: pc.line, raw: pc.raw, menu });
	}
	return claims;
};

const propInMenu = (snap: Snapshot, menu: string, prop: string): boolean => {
	const bare = prop.startsWith(".") ? prop.slice(1) : null;
	const argName = bare !== null ? null : prop; // dotted fields never live in args
	if (argName !== null) {
		const entry = snap.paths[menu];
		if (entry && Object.hasOwn(entry.args, argName)) return true;
		if (!/\/(add|set|print|get|find|remove|enable|disable|start|stop)$/.test(menu)) {
			for (const verb of ["add", "set"]) {
				const e = snap.paths[`${menu}/${verb}`];
				if (e && Object.hasOwn(e.args, argName)) return true;
			}
		}
	}
	const fields = snap.fields[menu];
	if (fields && fields.some((f) => f.name === prop || (bare !== null && f.name === bare))) return true;
	return false;
};

const propAnywhere = (snap: Snapshot, prop: string): boolean => {
	const bare = prop.startsWith(".") ? prop.slice(1) : prop;
	for (const entry of Object.values(snap.paths)) {
		if (!prop.startsWith(".") && Object.hasOwn(entry.args, prop)) return true;
	}
	for (const list of Object.values(snap.fields)) {
		if (list.some((f) => f.name === prop || f.name === bare)) return true;
	}
	return false;
};

// ── main ─────────────────────────────────────────────────────────────────────

const skillFile = `${PILOT_SKILL}/SKILL.md`;
const snapshotFile = `${PILOT_SKILL}/references/rosetta-snapshot.json`;

const skillText = await Bun.file(skillFile)
	.text()
	.catch(() => null);
if (skillText === null) {
	console.error(`✗ ${skillFile}: missing — run from the repo root`);
	process.exit(1);
}
const snapshotText = await Bun.file(snapshotFile)
	.text()
	.catch(() => null);
if (snapshotText === null) {
	console.error(`✗ ${snapshotFile}: missing (run bun scripts/build-refs.ts --export <dir>)`);
	process.exit(1);
}
const snapshot = JSON.parse(snapshotText) as Snapshot;
const claims = extract(skillFile, skillText);

let pathCount = 0;
let propCount = 0;
for (const c of claims) {
	if (c.kind === "path") {
		pathCount++;
		const reason = PATH_DENYLIST.get(c.path);
		if (reason) continue; // documented non-path example
		if (!Object.hasOwn(snapshot.paths, c.path)) {
			fail(`${skillFile}:${c.line}: unknown path \`${c.raw}\` (not in ${snapshotFile})`);
		}
		continue;
	}
	propCount++;
	const p = c.prop;
	if (UNIVERSAL_PROPS.has(p) || HISTORICAL_PROPS.has(p)) continue;
	if (DOCUMENTED_ABSENT.has(p) || OUTPUT_FIELDS.has(p)) continue;
	if (c.menu !== null && propInMenu(snapshot, c.menu, p)) continue;
	if (propAnywhere(snapshot, p)) continue;
	fail(
		`${skillFile}:${c.line}: unknown property \`${c.raw}\`` +
			(c.menu !== null ? ` (menu \`${c.menu}\`, not in snapshot)` : " (no menu context, not in snapshot)"),
	);
}

if (failures > 0) {
	console.error(`\n${failures} reference check error(s) (${pathCount} paths, ${propCount} props checked)`);
	process.exit(1);
}
console.log(`✓ ${PILOT_SKILL}: ${pathCount} paths, ${propCount} props resolve against the snapshot`);
