#!/usr/bin/env bun
// Builds one pilot skill's references/ from a local `rosetta export` directory
// (issue #38, Option A: vendored sliced snapshot).
//
//   bun scripts/build-refs.ts --export <dir>   # author-local: export -> snapshot + references
//   bun scripts/build-refs.ts --check          # CI-safe: snapshot -> references freshness
//
// The full export never enters the repo: --export slices the pilot skill's owned
// path prefixes out of commands.tsv plus the default cli-reference tree's
// entries/fields, and commits only that slice (rosetta-snapshot.json) with the
// generated markdown. --check needs no export dir; it re-renders the markdown
// from the committed snapshot and fails on drift, and it re-serializes the
// snapshot to catch hand-edits. The snapshot slice is defined by OWNED_PREFIXES
// below (authored per skill), never by what the SKILL.md happens to mention —
// otherwise scripts/check-refs.ts (SKILL.md claims must exist in the snapshot)
// would be circular.
//
// TSV parsing mirrors rosetta's documented contract (manifest [contract] section
// + src/export.ts parseTsv/decodeTsvField): one line per record, tab-separated,
// backslash escapes (\\ \t \n \r), whole-field \N for NULL, empty for "".

const PILOT_SKILL = "routeros-container";

// Authored scope: menus whose paths/props this skill's claims may reference.
// A claim outside these prefixes fails check-refs until the scope grows here.
const OWNED_PREFIXES = [
	"/app",
	"/console/inspect",
	"/container",
	"/interface/bridge/add",
	"/interface/bridge/port",
	"/interface/list/member",
	"/interface/veth/add",
	"/ip/address/add",
	"/ip/firewall/nat/add",
	"/log",
	"/system/device-mode/update",
	"/system/package/apply-changes",
	"/system/package/enable",
	"/system/package/print",
	"/system/package/update",
	"/system/reboot",
	"/system/resource",
];

let failures = 0;
const fail = (msg: string): void => {
	console.error(`✗ ${msg}`);
	failures++;
};

// ── TSV (rosetta contract, mirrored) ──────────────────────────────────────────

const TSV_NULL = "\\N";

const decodeTsvField = (field: string): string | null => {
	if (field === TSV_NULL) return null;
	let out = "";
	for (let i = 0; i < field.length; i++) {
		const ch = field[i];
		if (ch !== "\\") {
			out += ch;
			continue;
		}
		const next = field[++i];
		if (next === "\\") out += "\\";
		else if (next === "t") out += "\t";
		else if (next === "n") out += "\n";
		else if (next === "r") out += "\r";
		else throw new Error(`decodeTsvField: invalid escape \\${next ?? "<eof>"}`);
	}
	return out;
};

type TsvTable = { columns: string[]; rows: (string | null)[][] };

const parseTsv = (content: string): TsvTable => {
	const lines = content.replace(/\n$/, "").split("\n");
	const [header, ...body] = lines;
	return {
		columns: (header ?? "").split("\t").map((f) => decodeTsvField(f) as string),
		rows: body.map((line) => line.split("\t").map(decodeTsvField)),
	};
};

const colIndex = (table: TsvTable): Map<string, number> =>
	new Map(table.columns.map((c, i) => [c, i]));

// ── minimal manifest.toml [provenance] reader ─────────────────────────────────
// Only reads key = "value" lines inside [provenance]; nothing else is needed.

const readProvenance = (text: string): Record<string, string> => {
	const out: Record<string, string> = {};
	let inSection = false;
	for (const line of text.split("\n")) {
		if (/^\[.*\]\s*$/.test(line)) {
			inSection = line.trim() === "[provenance]";
			continue;
		}
		if (!inSection) continue;
		const m = line.match(/^([a-z_]+)\s*=\s*"(.*)"\s*$/);
		if (m) out[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}
	return out;
};

// ── snapshot model ───────────────────────────────────────────────────────────

type Snapshot = {
	generator: string;
	skill: string;
	rosetta: {
		release_tag: string;
		schema_version: string;
		source_commit: string;
		built_at: string;
		docs_manual_version: string;
		cliref_tree: string;
		cliref_rows_digest: string;
	};
	owned_prefixes: string[];
	paths: Record<string, { type: string; description: string | null; args: Record<string, string | null> }>;
	fields: Record<string, { name: string; kind: string; description: string | null }[]>;
};

const covers = (prefixes: string[], path: string): boolean =>
	prefixes.some((p) => path === p || path.startsWith(`${p}/`));

const snapshotPaths = (skillDir: string): { snapshot: string; md: string } => ({
	snapshot: `${skillDir}/references/rosetta-snapshot.json`,
	md: `${skillDir}/references/cli-reference.md`,
});

const buildSnapshot = async (exportDir: string): Promise<Snapshot> => {
	const manifestText = await Bun.file(`${exportDir}/manifest.toml`).text();
	if (!/^format = "rosetta-datasets"$/m.test(manifestText)) {
		throw new Error(`${exportDir}/manifest.toml is not a rosetta-datasets export`);
	}
	const prov = readProvenance(manifestText);
	for (const k of ["release_tag", "schema_version", "source_commit", "built_at", "docs_manual_version"]) {
		if (!prov[k]) throw new Error(`export manifest [provenance] lacks ${k}`);
	}

	const commands = parseTsv(await Bun.file(`${exportDir}/commands.tsv`).text());
	const cc = colIndex(commands);
	const pathI = cc.get("path") ?? -1;
	const nameI = cc.get("name") ?? -1;
	const typeI = cc.get("type") ?? -1;
	const descI = cc.get("description") ?? -1;
	if (pathI < 0 || nameI < 0 || typeI < 0 || descI < 0) {
		throw new Error("commands.tsv lacks path/name/type/description columns");
	}

	const trees = parseTsv(await Bun.file(`${exportDir}/cli-reference/trees.tsv`).text());
	const tc = colIndex(trees);
	const defaultTree = trees.rows.find((r) => r[tc.get("is_default") ?? -1] === "1");
	if (!defaultTree) throw new Error("cli-reference/trees.tsv has no default tree");
	const tree = defaultTree[tc.get("manual_version") ?? -1] as string;
	const digest = defaultTree[tc.get("rows_digest") ?? -1] as string;

	const entries = parseTsv(await Bun.file(`${exportDir}/cli-reference/entries.tsv`).text());
	const ec = colIndex(entries);
	const entryInspect = new Map<string, string>(); // entry_source_path -> inspect_path
	for (const r of entries.rows) {
		if (r[ec.get("manual_version") ?? -1] !== tree) continue;
		const src = r[ec.get("source_path") ?? -1] as string;
		const insp = r[ec.get("inspect_path") ?? -1] as string | null;
		if (src && insp && covers(OWNED_PREFIXES, insp)) entryInspect.set(src, insp);
	}

	const fields = parseTsv(await Bun.file(`${exportDir}/cli-reference/fields.tsv`).text());
	const fc = colIndex(fields);

	const snapshot: Snapshot = {
		generator: "scripts/build-refs.ts",
		skill: PILOT_SKILL,
		rosetta: {
			release_tag: prov["release_tag"],
			schema_version: prov["schema_version"],
			source_commit: prov["source_commit"],
			built_at: prov["built_at"],
			docs_manual_version: prov["docs_manual_version"],
			cliref_tree: tree,
			cliref_rows_digest: digest,
		},
		owned_prefixes: [...OWNED_PREFIXES].sort(),
		paths: {},
		fields: {},
	};

	for (const r of commands.rows) {
		const path = r[pathI] as string;
		if (!covers(OWNED_PREFIXES, path)) continue;
		const type = r[typeI] as string;
		const desc = r[descI];
		if (type === "arg") {
			const parent = path.slice(0, path.lastIndexOf("/")) || "/";
			const argName = path.slice(path.lastIndexOf("/") + 1);
			const entry = snapshot.paths[parent] ?? { type: "cmd", description: null, args: {} };
			entry.args[argName] = desc;
			snapshot.paths[parent] = entry;
		} else {
			const entry = snapshot.paths[path] ?? { type, description: desc, args: {} };
			entry.type = type;
			entry.description = desc;
			snapshot.paths[path] = entry;
		}
	}

	for (const r of fields.rows) {
		if (r[fc.get("manual_version") ?? -1] !== tree) continue;
		const src = r[fc.get("entry_source_path") ?? -1] as string;
		const insp = entryInspect.get(src);
		if (!insp) continue;
		const list = snapshot.fields[insp] ?? [];
		list.push({
			name: r[fc.get("name") ?? -1] as string,
			kind: r[fc.get("field_kind") ?? -1] as string,
			description: r[fc.get("description_markdown") ?? -1],
		});
		snapshot.fields[insp] = list;
	}
	for (const list of Object.values(snapshot.fields)) {
		list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	}
	return snapshot;
};

// Deterministic serialization: sorted keys at every level, LF, trailing newline.
const serializeSnapshot = (s: Snapshot): string => {
	const paths: Snapshot["paths"] = {};
	for (const p of Object.keys(s.paths).sort()) {
		const args: Record<string, string | null> = {};
		for (const a of Object.keys(s.paths[p].args).sort()) args[a] = s.paths[p].args[a];
		paths[p] = { type: s.paths[p].type, description: s.paths[p].description, args };
	}
	const fields: Snapshot["fields"] = {};
	for (const f of Object.keys(s.fields).sort()) fields[f] = s.fields[f];
	return (
		`${JSON.stringify(
			{
				generator: s.generator,
				skill: s.skill,
				rosetta: s.rosetta,
				owned_prefixes: [...s.owned_prefixes].sort(),
				paths,
				fields,
			},
			null,
			2,
		)}\n`
	);
};

const oneLine = (s: string | null): string =>
	(s ?? "—")
		.replace(/\s+/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // manual links have no anchor here; keep the text
		.replace(/\|/g, "\\|")
		.trim()
		.replace(/(^|[\s(])(https?:\/\/\S+?)([).,;!?]*)(?=[\s)]|$)/g, "$1<$2>$3"); // MD034: no bare URLs

const renderMarkdown = (s: Snapshot): string => {
	const lines: string[] = [
		`<!-- GENERATED from rosetta export ${s.rosetta.release_tag} (tree ${s.rosetta.cliref_tree}) by ${s.generator} — do not edit by hand. -->`,
		"",
		`# ${s.skill} CLI reference (rosetta ${s.rosetta.release_tag})`,
		"",
		"Generated slice of the rosetta export covering this skill's owned menus. Regenerate with `bun scripts/build-refs.ts --export <dir>`.",
		"",
		"| Provenance | Value |",
		"|---|---|",
		`| release_tag | \`${s.rosetta.release_tag}\` |`,
		`| schema_version | \`${s.rosetta.schema_version}\` |`,
		`| source_commit | \`${s.rosetta.source_commit}\` |`,
		`| built_at | \`${s.rosetta.built_at}\` |`,
		`| docs_manual_version | \`${s.rosetta.docs_manual_version}\` |`,
		`| cliref_tree | \`${s.rosetta.cliref_tree}\` |`,
		`| cliref_rows_digest | \`${s.rosetta.cliref_rows_digest.slice(0, 16)}…\` |`,
		"",
	];
	for (const p of Object.keys(s.paths).sort()) {
		const entry = s.paths[p];
		const argNames = Object.keys(entry.args).sort();
		if (argNames.length === 0) continue;
		lines.push(`## \`${p}\``, "");
		if (entry.description) lines.push(oneLine(entry.description), "");
		lines.push("| Property | Description |", "|---|---|");
		for (const a of argNames) lines.push(`| \`${a}\` | ${oneLine(entry.args[a])} |`);
		lines.push("");
	}
	const fieldMenus = Object.keys(s.fields).sort();
	if (fieldMenus.length > 0) {
		lines.push(`## Read-only and manual fields (tree ${s.rosetta.cliref_tree})`, "");
		for (const m of fieldMenus) {
			lines.push(`### \`${m}\``, "");
			lines.push("| Field | Kind | Description |", "|---|---|---|");
			for (const f of s.fields[m]) {
				lines.push(`| \`${f.name}\` | ${oneLine(f.kind)} | ${oneLine(f.description)} |`);
			}
			lines.push("");
		}
	}
	return `${lines.join("\n")}`;
};

// ── main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const checkMode = args.includes("--check");
const exportFlag = args.indexOf("--export");
const exportDir = exportFlag >= 0 ? args[exportFlag + 1] : undefined;

if (!checkMode && !exportDir) {
	console.error("Usage: bun scripts/build-refs.ts --export <dir> | --check");
	process.exit(1);
}

const { snapshot: snapshotPath, md: mdPath } = snapshotPaths(PILOT_SKILL);

if (checkMode) {
	const diskSnapshot = await Bun.file(snapshotPath)
		.text()
		.catch(() => null);
	if (diskSnapshot === null) {
		fail(`${snapshotPath}: missing (run bun scripts/build-refs.ts --export <dir>)`);
	} else {
		let parsed: Snapshot;
		try {
			parsed = JSON.parse(diskSnapshot) as Snapshot;
		} catch {
			fail(`${snapshotPath}: not valid JSON`);
			parsed = undefined as unknown as Snapshot;
		}
		if (parsed) {
			if (serializeSnapshot(parsed) !== diskSnapshot) {
				fail(`${snapshotPath}: out of date or hand-edited (re-run --export and commit)`);
			}
			const diskMd = await Bun.file(mdPath)
				.text()
				.catch(() => null);
			if (diskMd === null) {
				fail(`${mdPath}: missing (re-run --export and commit)`);
			} else if (renderMarkdown(parsed) !== diskMd) {
				fail(`${mdPath}: out of date (re-run bun scripts/build-refs.ts --export <dir>)`);
			}
		}
	}
} else {
	const snapshot = await buildSnapshot(exportDir as string);
	await Bun.write(snapshotPath, serializeSnapshot(snapshot));
	await Bun.write(mdPath, renderMarkdown(snapshot));
	const pathCount = Object.keys(snapshot.paths).length;
	const argCount = Object.values(snapshot.paths).reduce((n, p) => n + Object.keys(p.args).length, 0);
	console.log(
		`✓ ${PILOT_SKILL}: ${pathCount} paths, ${argCount} args, ${Object.keys(snapshot.fields).length} field menus from ${snapshot.rosetta.release_tag}/tree ${snapshot.rosetta.cliref_tree}`,
	);
}

if (failures > 0) {
	console.error(`\n${failures} reference build error(s)`);
	process.exit(1);
}
if (checkMode) console.log(`✓ ${PILOT_SKILL} references fresh`);
