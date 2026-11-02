#!/usr/bin/env bun
// Verifies every `/-path` and property named in the pilot SKILL.md exists in the
// vendored rosetta snapshot (issue #38). CI-safe: reads only the SKILL.md and the
// committed snapshot, never a live export.
//
//   bun scripts/check-refs.ts              # check the pilot SKILL.md
//   bun scripts/check-refs.ts --self-test  # run the negative/positive fixtures
//   bun scripts/check-refs.ts --verbose    # also list every claim with its class
//
// This is a documentation-presence check, not a CLI validator: a pass means the
// claim resolves against the pinned snapshot, never that a recipe was live-tested.
// Missing from the snapshot means unverified here, not nonexistent in RouterOS.
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
// HTML comment spans (`<!-- ... -->`) outside fenced code are blanked before
// extraction: comment text is never a claim. Fenced code is literal — a marker
// inside code hides nothing — while a fence opener inside a comment span is
// ignored, so commented-out examples stay invisible and open no phantom fence.
// Quote spans are tracked across the lines of a fenced block (a new command
// line starting with `/` or `:` resets the carry), so a multiline value never
// leaks classification into the next command.
//
// Claim kinds and their evidence bars (layering per rosetta DESIGN.md):
//   - input: `=` in command context (code line with an attributed command, or a
//     Property-table cell). Must be an inspect arg of the attributed command
//     (bare menus also try <menu>/add and <menu>/set). A same-name manual field
//     or a read-only field never validates an input.
//   - query: `~` operators, `[find ...]` predicates, and names after a
//     clause-level `where` in the same `;`-separated command (backslash
//     continuations join the logical line). A `where` inside brackets or
//     quotes, or as another prop's value (`comment=where`), opens no clause.
//     Must be an inspect arg or a manual field (any kind) of the attributed
//     element.
//   - output: dotted/bracket field references. Must be a manual field of the
//     attributed element, or a scoped runtime-field exception. The
//     documented-absent exception covers prose non-existence assertions (with
//     a negation cue) only — never code reads or prose presenting a read.
//   - mention: table/header cells, comment words, prose assigns, and `=` tokens
//     inside quoted value spans (sub-syntax of another prop's value). Must exist
//     anywhere in the owned slice; reported as noted, never as validated input.
// Attribution: same-line path first, then nearest preceding path in the block,
// then nearest preceding path in the document. An input/query/output claim with
// no attributable menu fails as unresolved context. Paths resolve from inspect
// commands or manual-only occurrences (reported with their manual provenance);
// directory claims never borrow parent-element fields.
// Exceptions are scoped by name, kind, menu, operation, and evidence — never
// global acceptance of a bare name — and exempted claims are reported separately.

const PILOT_SKILL = "routeros-container";
const FIXTURE_DIR = "scripts/fixtures/refs";

// FS/container-internal lookalikes documented as examples, not RouterOS paths.
const PATH_DENYLIST = new Map<string, string>([
	["/etc/pihole", "container-internal filesystem example, not a RouterOS path"],
	["/data", "host filesystem path example, not a RouterOS path"],
	["/container/path", "container-internal path placeholder, not a RouterOS path"],
]);

// RouterOS built-ins, inconsistently present per-menu in the export (verified:
// /container/add/name exists but /ip/address/add/name and /container/mounts/add/name
// do not; /container/add/disabled is absent while /ip/address/add/disabled exists).
// Scoped per operation, never by bare name: inputs only on add-family commands
// and sets with a sibling add (singleton sets configure no items), queries
// only where the command takes `where`, sets items, or takes `numbers` for a
// `[find ...]` predicate over item fields.
const UNIVERSAL_PROPS = new Set(["name", "comment", "disabled"]);

// Pre-7.20 name, documented as history; absent from the 7.24.5+ export.
// Mention-kind only: an input claim of envlist= is a version error, not history.
const HISTORICAL_PROPS = new Set(["envlist"]);

// REST runtime fields, verified absent from the manual-derived export (`running`
// exists only under unrelated menus; `.running` nowhere). Output-kind only,
// menu-scoped to /container with per-field evidence.
const OUTPUT_RUNTIME: Record<string, Record<string, string>> = {
	"/container": {
		".running": "REST runtime status field; skill demonstrates string values via fetch",
		".id": "REST item identity; skill passes it in POST bodies",
	},
};

// Explicitly documented as not existing ("No .stopped field exists").
// Output/mention-kind only, menu-scoped to /container, and only on lines that
// read as a non-existence assertion (prose outside code, with a negation cue).
const DOCUMENTED_ABSENT: Record<string, Record<string, string>> = {
	"/container": {
		".stopped": "skill asserts non-existence; must never resolve or be flagged missing",
	},
};

// Same-line negation cues that mark a documented-absent claim as an assertion
// of non-existence rather than a read of the field.
const ABSENCE_CUE_RE = /\b(no|not|never|without|absent|missing|none|nothing|n't)\b/i;

let failures = 0;
const fail = (msg: string): void => {
	console.error(`✗ ${msg}`);
	failures++;
};

type Snapshot = {
	rosetta: { format: string; format_version: number };
	paths: Record<string, { type: string; description: string | null; args: Record<string, string | null> }>;
	occurrences: {
		manual_version: string;
		entry_id: string;
		source_path: string;
		inspect_path: string | null;
		fields: { name: string; kind: string }[];
	}[];
};

type ClaimKind = "input" | "query" | "output" | "mention";
type PropClaim = {
	kind: "prop";
	prop: string;
	propKind: ClaimKind;
	line: number;
	raw: string;
	menu: string | null;
	inCode: boolean;
	inFind: boolean;
	lineText: string;
};
type Claim = { kind: "path"; path: string; line: number; raw: string } | PropClaim;

const PATH_RE = /\/[A-Za-z][A-Za-z0-9_.${}*-]*(?:\/[A-Za-z0-9_.${}*-]+)*/g;
const PATH_BOUNDARY = /[A-Za-z0-9_.$/-]/;
const ASSIGN_RE = /(^|[^A-Za-z0-9_.$~/-])([a-z][a-z0-9-]*)(=|~)(?![=~>])/g;
const TABLE_CELL_RE = /`([a-z][a-z0-9-]*)`/g;
const DOTTED_QUOTED_RE = /`\.([a-z][a-z0-9-]*)`/g;
const BRACKET_INDEX_RE = /\["([a-z][a-z0-9-]*)"\]|"(\.[a-z][a-z0-9-]*)"/g;
const COMMENT_WORD_RE = /([a-z][a-z0-9-]*-[a-z][a-z0-9-]*)/g;

const normalizePath = (raw: string): string | null => {
	const folded = raw
		.replace(/[.,;:!?)]+$/, "")
		.replace(/\/(?:\*[^/]*|\$\{[^}]*\})$/, "");
	if (folded.length < 3) return null;
	return folded;
};

type Fence = { lang: string; start: number; end: number };

const fenceAt = (fences: Fence[], line: number): Fence | null =>
	fences.find((f) => line > f.start && line < f.end) ?? null;

// Find `marker` at/after `from`, skipping matched single-backtick code spans,
// so a marker shown as code (`` `<!--` ``) is not treated as a real comment.
// An unmatched backtick is literal text and pairs with nothing.
const findOutsideSpans = (line: string, marker: string, from: number): number => {
	const ticks: number[] = [];
	for (let i = 0; i < line.length; i++) if (line[i] === "`") ticks.push(i);
	const paired = new Set(ticks.length % 2 === 1 ? ticks.slice(0, -1) : ticks);
	let inSpan = false;
	for (let i = from; i < line.length; i++) {
		if (paired.has(i)) {
			inSpan = !inSpan;
			continue;
		}
		if (!inSpan && line.startsWith(marker, i)) return i;
	}
	return -1;
};

const FENCE_RE = /^```(\S*)\s*$/;

// Single ordered scan for fences and HTML comments. A fence opener inside a
// comment span is ignored (commented-out examples stay invisible and open no
// phantom fence); a comment marker inside fenced code is ignored (code is
// literal, so a marker there hides nothing). A fence that opens while a
// comment is already open stays commented: its lines go through stripping.
const scanDocument = (rawLines: string[]): { lines: string[]; fences: Fence[] } => {
	const lines: string[] = [];
	const fences: Fence[] = [];
	let open: { lang: string; start: number } | null = null;
	let inside = false;
	for (const line of rawLines) {
		if (open !== null) {
			lines.push(line);
			if (FENCE_RE.test(line)) {
				fences.push({ lang: open.lang, start: open.start, end: lines.length - 1 });
				open = null;
			}
			continue;
		}
		const m = inside ? null : line.match(FENCE_RE);
		if (m) {
			open = { lang: m[1] || "plain", start: lines.length };
			lines.push(line);
			continue;
		}
		let out = "";
		let pos = 0;
		for (;;) {
			if (inside) {
				const end = findOutsideSpans(line, "-->", pos);
				if (end < 0) break;
				inside = false;
				pos = end + 3;
			} else {
				const start = findOutsideSpans(line, "<!--", pos);
				if (start < 0) {
					out += line.slice(pos);
					break;
				}
				out += line.slice(pos, start);
				pos = start + 4;
				inside = true;
			}
		}
		lines.push(out);
	}
	return { lines, fences };
};

type Span = { start: number; end: number };

// A line starting a new RouterOS command resets carried quote state: the new
// command is evidence the previous value ended, unbalanced quote or not.
const COMMAND_START_RE = /^\s*[/:]/;

// Double-quoted span contents per line as [start, end) columns (escapes
// respected, so `\"` never flips the state). Fenced lines scan as one block so
// quote state carries across the lines of a multiline value; prose lines scan
// independently.
const quotedSpans = (lines: string[], fences: Fence[]): Map<number, Span[]> => {
	const spans = new Map<number, Span[]>();
	const scanBlock = (rows: number[]): void => {
		let quoted = false;
		for (const i of rows) {
			const line = lines[i];
			if (COMMAND_START_RE.test(line)) quoted = false;
			const out: Span[] = [];
			let spanStart = quoted ? 0 : -1;
			let j = 0;
			while (j < line.length) {
				const ch = line[j];
				if (ch === "\\") {
					j += 2;
					continue;
				}
				if (ch === '"') {
					if (quoted) {
						out.push({ start: spanStart, end: j });
						quoted = false;
					} else {
						quoted = true;
						spanStart = j + 1;
					}
				}
				j++;
			}
			if (quoted) out.push({ start: spanStart, end: line.length });
			spans.set(i, out);
		}
	};
	const fenced = new Set<number>();
	for (const f of fences) {
		const rows: number[] = [];
		for (let i = f.start + 1; i < f.end; i++) {
			rows.push(i);
			fenced.add(i);
		}
		scanBlock(rows);
	}
	for (let i = 0; i < lines.length; i++) {
		if (!fenced.has(i)) scanBlock([i]);
	}
	return spans;
};

const inSpans = (spans: Span[] | undefined, col: number): boolean =>
	spans?.some((s) => col >= s.start && col < s.end) ?? false;

// Blank span contents with spaces, preserving columns, so quote contents never
// steer classification.
const blankSpans = (line: string, spans: Span[] | undefined): string => {
	if (!spans || spans.length === 0) return line;
	const chars = line.split("");
	for (const s of spans) {
		for (let j = s.start; j < Math.min(s.end, chars.length); j++) chars[j] = " ";
	}
	return chars.join("");
};

// Structural query analysis of the quote-blanked text before an `=` token: the
// token is a query when it sits inside a `[find ...]` predicate (or a bracket
// group with its own `where`) or after a clause-level `where` in the same
// `;`-separated command. A `where` inside brackets, or as another prop's value
// (`comment=where`), opens no clause. `inFind` survives to verification so
// find-predicate claims keep their own evidence bar.
const queryContext = (blankedBefore: string): { query: boolean; inFind: boolean } => {
	let depth = 0;
	let segStart = 0;
	for (let k = 0; k < blankedBefore.length; k++) {
		const ch = blankedBefore[k];
		if (ch === "[") depth++;
		else if (ch === "]") depth = Math.max(0, depth - 1);
		else if (ch === ";" && depth === 0) segStart = k + 1;
	}
	const seg = blankedBefore.slice(segStart);
	const findStack: boolean[] = [];
	const whereStack: boolean[] = [];
	let depth0Where = false;
	depth = 0;
	let k = 0;
	while (k < seg.length) {
		const ch = seg[k];
		if (ch === "[") {
			const head = seg
				.slice(k + 1)
				.match(/^\s*(\S+)/)?.[1]
				.split("/").pop()
				?.toLowerCase();
			findStack.push(head === "find");
			whereStack.push(false);
			depth++;
			k++;
			continue;
		}
		if (ch === "]") {
			if (depth > 0) {
				findStack.pop();
				whereStack.pop();
				depth--;
			}
			k++;
			continue;
		}
		if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) {
			const prev = k > 0 ? seg[k - 1] : "";
			if (/[A-Za-z0-9_.$~/-]/.test(prev)) {
				k++;
				continue;
			}
			let e = k + 1;
			while (e < seg.length && /[A-Za-z0-9_-]/.test(seg[e])) e++;
			if (seg.slice(k, e).toLowerCase() === "where") {
				let p = k - 1;
				while (p >= 0 && (seg[p] === " " || seg[p] === "\t")) p--;
				const before = p >= 0 ? seg[p] : "";
				if (before !== "=" && before !== "~") {
					if (depth === 0) depth0Where = true;
					else whereStack[whereStack.length - 1] = true;
				}
			}
			k = e;
			continue;
		}
		k++;
	}
	if (depth > 0) {
		const inFind = findStack.some(Boolean) || whereStack.some(Boolean);
		return { query: inFind, inFind };
	}
	return { query: depth0Where, inFind: false };
};

// True when the line's last span runs to end-of-line: the value continues on
// the next line.
const endsInQuote = (spans: Span[] | undefined, len: number): boolean => {
	if (!spans || spans.length === 0) return false;
	return spans[spans.length - 1].end >= len;
};

// Logical-command splicing: walk back over previous lines of the same fenced
// command — explicit `\` continuations, lines left inside unclosed brackets,
// and lines ending inside a carried quote — splicing their code parts (with
// `routeros` `#` comments removed, so comment text neither continues a line
// nor opens a clause) ahead of the current line's blanked prefix. A line
// starting a new command ends the bracket/quote walk.
const logicalBefore = (
	lines: string[],
	clean: string[],
	code: string[],
	quoted: Map<number, Span[]>,
	fences: Fence[],
	blockDepth: number[],
	i: number,
	col: number,
): string => {
	let out = clean[i].slice(0, col);
	if (fenceAt(fences, i) === null) return out;
	let j = i;
	const fence = fenceAt(fences, i) as Fence;
	while (j - 1 > fence.start) {
		const tail = code[j - 1];
		let e = tail.length - 1;
		while (e >= 0 && (tail[e] === " " || tail[e] === "\t")) e--;
		if (e >= 0 && tail[e] === "\\" && !inSpans(quoted.get(j - 1), e)) {
			let bs = 0;
			let q = e;
			while (q >= 0 && tail[q] === "\\" && !inSpans(quoted.get(j - 1), q)) {
				bs++;
				q--;
			}
			if (bs % 2 === 1) {
				out = `${clean[j - 1].slice(0, e)} ${out}`;
				j--;
				continue;
			}
		}
		if (COMMAND_START_RE.test(lines[j])) break;
		if (blockDepth[j] > 0 || endsInQuote(quoted.get(j - 1), lines[j - 1].length)) {
			out = `${code[j - 1]} ${out}`;
			j--;
			continue;
		}
		break;
	}
	return out;
};

const extract = (text: string): Claim[] => {
	const claims: Claim[] = [];
	const rawLines = text.split("\n");
	const { lines, fences } = scanDocument(rawLines);
	const quoted = quotedSpans(lines, fences);
	const clean = lines.map((l, i) => blankSpans(l, quoted.get(i)));
	// Code parts: quote-blanked lines with `routeros` `#` comments removed, so
	// comment text never steers continuation or clause analysis.
	const code = lines.map((_, i) => {
		if (fenceAt(fences, i)?.lang !== "routeros") return clean[i];
		const h = clean[i].indexOf("#");
		return h < 0 ? clean[i] : clean[i].slice(0, h);
	});
	// Bracket depth at each line's start, tracked forward per fenced block over
	// quote-blanked lines; prose lines sit at depth 0 (no continuation there).
	const blockDepth = new Array<number>(lines.length).fill(0);
	for (const f of fences) {
		let d = 0;
		for (let i = f.start + 1; i < f.end; i++) {
			blockDepth[i] = d;
			for (const ch of clean[i]) {
				if (ch === "[") d++;
				else if (ch === "]") d = Math.max(0, d - 1);
			}
		}
	}
	const frontmatter = new Set<number>();
	if (lines[0] === "---") {
		frontmatter.add(0);
		let closed = false;
		for (let i = 1; i < lines.length; i++) {
			frontmatter.add(i);
			if (lines[i] === "---") {
				closed = true;
				break;
			}
		}
		// An unclosed block would otherwise silence the whole file: fail loud.
		if (!closed) throw new Error("unclosed frontmatter block");
	}
	const inFrontmatter = (i: number): boolean => frontmatter.has(i);
	// First pass: path claims with columns for same-line attribution.
	const pathAtLine = new Map<number, { col: number; path: string }[]>();
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^```(\S*)\s*$/.test(line) || inFrontmatter(i)) continue;
		if (fenceAt(fences, i)?.lang === "text") continue;
		PATH_RE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = PATH_RE.exec(line)) !== null) {
			if (m.index > 0 && PATH_BOUNDARY.test(line[m.index - 1])) continue;
			const norm = normalizePath(m[0]);
			if (norm === null) continue;
			claims.push({ kind: "path", path: norm, line: i + 1, raw: m[0] });
			if (PATH_DENYLIST.has(norm)) continue; // documented non-path: no attribution
			pathAtLine.set(i, [...(pathAtLine.get(i) ?? []), { col: m.index, path: norm }]);
		}
	}
	// Table map for rule 3.
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
	// Second pass: prop claims with kinds; attribution after the loop.
	type Raw = { prop: string; propKind: ClaimKind; line: number; col: number; raw: string; inFind: boolean };
	const raw: Raw[] = [];
	const pushProp = (
		prop: string,
		propKind: ClaimKind,
		line: number,
		col: number,
		rawText: string,
		inFind = false,
	): void => {
		raw.push({ prop, propKind, line: line + 1, col, raw: rawText, inFind });
	};
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^```(\S*)\s*$/.test(line) || inFrontmatter(i)) continue;
		const fence = fenceAt(fences, i);
		if (fence?.lang === "text") continue;
		if (fence === null && isTableRow[i]) {
			if (isDelimRow[i + 1]) {
				TABLE_CELL_RE.lastIndex = 0;
				let m: RegExpExecArray | null;
				while ((m = TABLE_CELL_RE.exec(line)) !== null) pushProp(m[1], "mention", i, m.index, m[0]);
			} else if (!isDelimRow[i] && headerFirstCell.get(i) === "Property") {
				const firstCell = line.split("|")[1] ?? "";
				const offset = line.indexOf(firstCell);
				TABLE_CELL_RE.lastIndex = 0;
				let m: RegExpExecArray | null;
				while ((m = TABLE_CELL_RE.exec(firstCell)) !== null) {
					pushProp(m[1], "input", i, offset + m.index, m[0]);
				}
			}
		}
		if (fence?.lang !== "sh") {
			ASSIGN_RE.lastIndex = 0;
			let m: RegExpExecArray | null;
			while ((m = ASSIGN_RE.exec(line)) !== null) {
				const col = m.index + m[1].length;
				// Comment text is a mention at most, even with `=`/`~` in it.
				const hash = fence?.lang === "routeros" ? clean[i].indexOf("#") : -1;
				if (hash >= 0 && hash < col) {
					pushProp(m[2], "mention", i, col, `${m[2]}${m[3]}`);
					continue;
				}
				// Inside a double-quoted value span (e.g. mount="src=..,dst=..") the
				// token is sub-syntax of another prop's value: mention at most.
				if (inSpans(quoted.get(i), col)) {
					pushProp(m[2], "mention", i, col, `${m[2]}${m[3]}`);
					continue;
				}
				const ctx = queryContext(logicalBefore(lines, clean, code, quoted, fences, blockDepth, i, col));
				if (m[3] === "~" || ctx.query) {
					pushProp(m[2], "query", i, col, `${m[2]}${m[3]}`, ctx.inFind);
					continue;
				}
				// Past the comment and query checks: code context means input.
				const commandContext = fence?.lang === "routeros" && !isTableRow[i];
				pushProp(m[2], commandContext ? "input" : "mention", i, col, `${m[2]}${m[3]}`);
			}
		}
		DOTTED_QUOTED_RE.lastIndex = 0;
		let dm: RegExpExecArray | null;
		while ((dm = DOTTED_QUOTED_RE.exec(line)) !== null) pushProp(`.${dm[1]}`, "output", i, dm.index, dm[0]);
		if (fence !== null && fence.lang !== "sh") {
			BRACKET_INDEX_RE.lastIndex = 0;
			let bm: RegExpExecArray | null;
			while ((bm = BRACKET_INDEX_RE.exec(line)) !== null) {
				pushProp(bm[1] ?? bm[2], "output", i, bm.index, bm[0]);
			}
		}
		if (fence?.lang === "routeros" && clean[i].includes("#")) {
			const offset = clean[i].indexOf("#");
			const comment = clean[i].slice(offset);
			COMMENT_WORD_RE.lastIndex = 0;
			let cm: RegExpExecArray | null;
			while ((cm = COMMENT_WORD_RE.exec(comment)) !== null) {
				if (!/[0-9]/.test(cm[1])) pushProp(cm[1], "mention", i, offset + cm.index, cm[1]);
			}
		}
	}
	// Attribution: same-line path first, then preceding in block, then preceding
	// in document. Mentions are slice-scoped and skip attribution.
	const docPaths: { line: number; path: string }[] = [];
	for (const [ln, ps] of pathAtLine) for (const p of ps) docPaths.push({ line: ln, path: p.path });
	docPaths.sort((a, b) => a.line - b.line);
	for (const r of raw) {
		const inCode = fenceAt(fences, r.line - 1) !== null;
		const lineText = lines[r.line - 1];
		if (r.propKind === "mention") {
			claims.push({
				kind: "prop",
				prop: r.prop,
				propKind: r.propKind,
				line: r.line,
				raw: r.raw,
				menu: null,
				inCode,
				inFind: r.inFind,
				lineText,
			});
			continue;
		}
		let menu: string | null = null;
		const sameLine = (pathAtLine.get(r.line - 1) ?? []).filter((p) => p.col < r.col);
		if (sameLine.length > 0) {
			menu = sameLine[sameLine.length - 1].path;
		} else {
			const fence = fenceAt(fences, r.line - 1);
			if (fence !== null) {
				for (let j = r.line - 2; j > fence.start; j--) {
					const ps = pathAtLine.get(j);
					if (ps && ps.length > 0) {
						menu = ps[ps.length - 1].path;
						break;
					}
				}
			}
			if (menu === null) {
				const docPre = docPaths.filter((d) => d.line < r.line - 1);
				if (docPre.length > 0) menu = docPre[docPre.length - 1].path;
			}
		}
		claims.push({
			kind: "prop",
			prop: r.prop,
			propKind: r.propKind,
			line: r.line,
			raw: r.raw,
			menu,
			inCode,
			inFind: r.inFind,
			lineText,
		});
	}
	return claims;
};

// ── evidence indexes ─────────────────────────────────────────────────────────

type Indexes = {
	inspectArgs: Map<string, Set<string>>;
	cmdType: Map<string, string>;
	elementFields: Map<string, { name: string; kind: string }[]>;
	sliceArgs: Set<string>;
	sliceFields: Set<string>;
};

const buildIndexes = (snap: Snapshot): Indexes => {
	const indexes: Indexes = {
		inspectArgs: new Map(),
		cmdType: new Map(),
		elementFields: new Map(),
		sliceArgs: new Set(),
		sliceFields: new Set(),
	};
	for (const [p, entry] of Object.entries(snap.paths)) {
		indexes.cmdType.set(p, entry.type);
		const args = new Set(Object.keys(entry.args));
		indexes.inspectArgs.set(p, args);
		for (const a of args) indexes.sliceArgs.add(a);
	}
	for (const o of snap.occurrences) {
		const key = o.inspect_path ?? `/${o.source_path}`;
		const list = indexes.elementFields.get(key) ?? [];
		for (const f of o.fields) {
			list.push({ name: f.name, kind: f.kind });
			indexes.sliceFields.add(f.name);
		}
		indexes.elementFields.set(key, list);
	}
	return indexes;
};

// Element walk-up: a command's fields live on its menu element
// (/container/start -> /container). Commands only: a directory claim must
// resolve against its own element, never borrow the parent's fields.
const elementChain = (indexes: Indexes, menu: string): string[] => {
	if (indexes.cmdType.get(menu) !== "cmd") return [menu];
	const parent = menu.slice(0, menu.lastIndexOf("/"));
	return parent && parent !== menu ? [menu, parent] : [menu];
};

const commandChain = (indexes: Indexes, menu: string): string[] => {
	if (indexes.cmdType.get(menu) === "cmd") return [menu];
	const out = [menu];
	for (const verb of ["add", "set"]) {
		if (indexes.inspectArgs.has(`${menu}/${verb}`)) out.push(`${menu}/${verb}`);
	}
	return out;
};

// Built-in inputs are only plausible on operations that set item properties:
// add-family commands that take inputs, and set-family commands with a sibling
// add (a set without one configures a singleton — global config, device
// settings — with no item identity for name/comment/disabled). Neither
// operating on an item (/container/start takes `numbers` only) nor inspecting
// it (/console/inspect takes inspector args) evidences the built-ins.
const opSetsItems = (indexes: Indexes, cmd: string): boolean => {
	if ((indexes.inspectArgs.get(cmd)?.size ?? 0) === 0) return false;
	if (cmd.endsWith("/add")) return true;
	if (!cmd.endsWith("/set")) return false;
	return indexes.inspectArgs.has(`${cmd.slice(0, -4)}/add`);
};

const chainSetsItems = (indexes: Indexes, menu: string): boolean =>
	commandChain(indexes, menu).some((c) => opSetsItems(indexes, c));

// Print-family commands take `where`: their where-clause names reference item
// fields, not inspect args of the print itself.
const chainTakesWhere = (indexes: Indexes, menu: string): boolean =>
	commandChain(indexes, menu).some((c) => indexes.inspectArgs.get(c)?.has("where") ?? false);

// Numbers-taking commands (start/stop/remove/enable/disable/get, ...) accept
// `[find ...]` predicates over item fields.
const chainTakesNumbers = (indexes: Indexes, menu: string): boolean =>
	commandChain(indexes, menu).some((c) => indexes.inspectArgs.get(c)?.has("numbers") ?? false);

type Verdict =
	| { ok: true; class: string }
	| { ok: false; reason: string };

const verifyProp = (indexes: Indexes, claim: PropClaim): Verdict => {
	const { prop, propKind: kind, menu, inCode, inFind, lineText } = claim;
	// Evidence first: exemptions are fallbacks, so a claim the export supports
	// is reported as validated, never as exempt.
	if (kind === "mention") {
		if (indexes.sliceArgs.has(prop) || indexes.sliceFields.has(prop)) return { ok: true, class: "mention" };
		if (UNIVERSAL_PROPS.has(prop)) return { ok: true, class: "exempt-universal" };
		if (HISTORICAL_PROPS.has(prop)) return { ok: true, class: "exempt-historical" };
		return { ok: false, reason: `unknown property \`${prop}\` (not in snapshot slice)` };
	}
	if (menu === null) return { ok: false, reason: `unresolved context for \`${prop}\` (no attributable menu)` };
	if (kind === "input") {
		for (const c of commandChain(indexes, menu)) {
			if (indexes.inspectArgs.get(c)?.has(prop)) return { ok: true, class: "input" };
		}
		if (UNIVERSAL_PROPS.has(prop) && chainSetsItems(indexes, menu)) {
			return { ok: true, class: "exempt-universal" };
		}
		return { ok: false, reason: `unknown input \`${prop}\` for \`${menu}\` (not an inspect arg)` };
	}
	if (kind === "query") {
		for (const c of commandChain(indexes, menu)) {
			if (indexes.inspectArgs.get(c)?.has(prop)) return { ok: true, class: "query" };
		}
		for (const e of elementChain(indexes, menu)) {
			if (indexes.elementFields.get(e)?.some((f) => f.name === prop)) return { ok: true, class: "query" };
		}
		if (
			UNIVERSAL_PROPS.has(prop) &&
			(chainTakesWhere(indexes, menu) ||
				chainSetsItems(indexes, menu) ||
				(inFind && chainTakesNumbers(indexes, menu)))
		) {
			return { ok: true, class: "exempt-universal" };
		}
		return { ok: false, reason: `unknown query field \`${prop}\` for \`${menu}\` (not an arg or field)` };
	}
	// output
	const bare = prop.startsWith(".") ? prop.slice(1) : prop;
	for (const e of elementChain(indexes, menu)) {
		if (indexes.elementFields.get(e)?.some((f) => f.name === prop || f.name === bare)) {
			return { ok: true, class: "output" };
		}
	}
	if (UNIVERSAL_PROPS.has(bare) && elementChain(indexes, menu).some((e) => chainSetsItems(indexes, e))) {
		return { ok: true, class: "exempt-universal" };
	}
	for (const e of elementChain(indexes, menu)) {
		if (OUTPUT_RUNTIME[e]?.[prop]) return { ok: true, class: "exempt-runtime" };
		// Absence assertions live in prose with a negation cue; code that reads
		// the field — or prose presenting it as readable — is a real use and
		// must resolve.
		if (!inCode && DOCUMENTED_ABSENT[e]?.[prop] && ABSENCE_CUE_RE.test(lineText)) {
			return { ok: true, class: "exempt-absent" };
		}
	}
	return { ok: false, reason: `unknown output field \`${prop}\` for \`${menu}\` (not a manual field)` };
};

const verify = (
	file: string,
	text: string,
	snapshot: Snapshot,
	verbose: boolean,
): { failures: string[]; counts: Record<string, number> } => {
	const indexes = buildIndexes(snapshot);
	const failures: string[] = [];
	const counts: Record<string, number> = {
		paths: 0,
		denylisted: 0,
		input: 0,
		query: 0,
		output: 0,
		mention: 0,
		exempt: 0,
	};
	const manualPaths = new Map<string, string>();
	for (const o of snapshot.occurrences) {
		if (o.inspect_path !== null) continue;
		const key = `/${o.source_path.replace(/^\/+|\/+$/g, "")}`;
		if (!manualPaths.has(key)) manualPaths.set(key, `manual ${o.manual_version} entry ${o.entry_id}`);
	}
	let claims: Claim[];
	try {
		claims = extract(text);
	} catch (e) {
		return { failures: [`${file}: ${e instanceof Error ? e.message : String(e)}`], counts };
	}
	for (const c of claims) {
		if (c.kind === "path") {
			if (PATH_DENYLIST.has(c.path)) {
				counts["denylisted"]++;
				if (verbose) console.log(`${file}:${c.line}: path \`${c.raw}\` -> denylisted (documented non-path)`);
				continue;
			}
			if (Object.hasOwn(snapshot.paths, c.path)) {
				counts["paths"]++;
				if (verbose) console.log(`${file}:${c.line}: path \`${c.raw}\` -> valid`);
				continue;
			}
			const prov = manualPaths.get(c.path);
			if (prov !== undefined) {
				counts["paths"]++;
				if (verbose) console.log(`${file}:${c.line}: path \`${c.raw}\` -> valid (${prov})`);
				continue;
			}
			failures.push(`${file}:${c.line}: unknown path \`${c.raw}\` (not in snapshot)`);
			continue;
		}
		const v = verifyProp(indexes, c);
		if (!v.ok) {
			failures.push(`${file}:${c.line}: ${v.reason}`);
			continue;
		}
		if (verbose) {
			console.log(
				`${file}:${c.line}: ${c.propKind} \`${c.raw}\`` +
					(c.menu !== null ? ` @ ${c.menu}` : "") +
					` -> ${v.class}`,
			);
		}
		if (v.class.startsWith("exempt")) counts["exempt"]++;
		else counts[v.class]++;
	}
	return { failures, counts };
};

// ── main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const selfTest = args.includes("--self-test");
const verbose = args.includes("--verbose");

const skillFile = `${PILOT_SKILL}/SKILL.md`;
const snapshotFile = `${PILOT_SKILL}/references/rosetta-snapshot.json`;

const snapshotText = await Bun.file(snapshotFile)
	.text()
	.catch(() => null);
if (snapshotText === null) {
	console.error(`✗ ${snapshotFile}: missing (run bun scripts/build-refs.ts --export <dir>)`);
	process.exit(1);
}
const snapshot = JSON.parse(snapshotText) as Snapshot;
if (snapshot.rosetta?.format !== "rosetta-datasets" || snapshot.rosetta?.format_version !== 2) {
	console.error(`✗ ${snapshotFile}: unsupported snapshot contract (want rosetta-datasets v2)`);
	process.exit(1);
}

if (selfTest) {
	const { Glob } = await import("bun");
	const fixtures = (await Array.fromAsync(new Glob("*.md").scan(FIXTURE_DIR))).sort();
	if (fixtures.length === 0) {
		console.error(`✗ no fixtures in ${FIXTURE_DIR} — run from the repo root`);
		process.exit(1);
	}
	let fixtureFailures = 0;
	for (const f of fixtures) {
		const text = await Bun.file(`${FIXTURE_DIR}/${f}`).text();
		const expect = text.match(/<!--\s*expect:\s*(pass|fail)\s*-->/)?.[1];
		const token = text.match(/<!--\s*expect-token:\s*(\S+)\s*-->/)?.[1];
		const countsWant = text.match(/<!--\s*expect-counts:\s*([a-z0-9=,\s]+)\s*-->/)?.[1];
		if (!expect) {
			console.error(`✗ ${f}: missing <!-- expect: pass|fail --> directive`);
			fixtureFailures++;
			continue;
		}
		const { failures: diags, counts } = verify(f, text, snapshot, false);
		const passed = diags.length === 0;
		let failed = (expect === "pass") !== passed;
		if (failed) {
			console.error(`✗ ${f}: expected ${expect}, got ${passed ? "pass" : `fail:\n    ${diags.join("\n    ")}`}`);
		} else if (expect === "fail" && token && !diags.some((d) => d.includes(token))) {
			console.error(`✗ ${f}: failed without mentioning \`${token}\`:\n    ${diags.join("\n    ")}`);
			failed = true;
		} else if (countsWant) {
			for (const pair of countsWant.split(",")) {
				const [k, v] = pair.trim().split("=");
				if ((counts[k] ?? 0) !== Number(v)) {
					console.error(`✗ ${f}: expected ${k}=${v}, got ${k}=${counts[k] ?? 0}`);
					failed = true;
				}
			}
		}
		if (failed) fixtureFailures++;
		else console.log(`✓ ${f}: ${expect}${token ? ` (mentions ${token})` : ""}`);
	}
	if (fixtureFailures > 0) {
		console.error(`\n${fixtureFailures} fixture failure(s)`);
		process.exit(1);
	}
	console.log(`✓ ${fixtures.length} fixtures behave as expected`);
	process.exit(0);
}

const skillText = await Bun.file(skillFile)
	.text()
	.catch(() => null);
if (skillText === null) {
	console.error(`✗ ${skillFile}: missing — run from the repo root`);
	process.exit(1);
}
const { failures: diags, counts } = verify(skillFile, skillText, snapshot, verbose);
for (const d of diags) console.error(`✗ ${d}`);
const tally =
	`${counts["paths"]} paths valid` +
	(counts["denylisted"] > 0 ? `, ${counts["denylisted"]} denylisted non-paths` : "") +
	`; ${counts["input"]} input, ${counts["query"]} query, ${counts["output"]} output, ` +
	`${counts["mention"]} mention, ${counts["exempt"]} exempt`;
if (diags.length > 0) {
	console.error(`\n${diags.length} reference check error(s) (${tally})`);
	process.exit(1);
}
console.log(`✓ ${PILOT_SKILL}: ${tally}`);
