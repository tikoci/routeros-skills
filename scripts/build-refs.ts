#!/usr/bin/env bun
// Builds one pilot skill's references/ from a local `rosetta export` directory
// (issue #38, Option A: vendored sliced snapshot).
//
//   bun scripts/build-refs.ts --export <dir>   # author-local: export -> snapshot + references
//   bun scripts/build-refs.ts --check          # CI-safe: snapshot + references freshness
//
// The full export never enters the repo: --export slices the pilot skill's owned
// path prefixes out of commands.tsv plus the default cli-reference tree's
// entries/fields/flags, and commits only that slice (rosetta-snapshot.json) with
// the generated markdown. --check needs no export dir: it re-renders the markdown
// from the committed snapshot and fails on drift, re-serializes the snapshot to
// catch formatting drift, recomputes the slice hash to catch semantic hand-edits
// (recomputing a valid hash requires the tool, i.e. a rebuild), and compares the
// snapshot's owned scope against OWNED_PREFIXES so scope edits also require a rebuild.
// The snapshot slice is defined by OWNED_PREFIXES below (authored per skill),
// never by what the SKILL.md happens to mention — otherwise
// scripts/check-refs.ts (SKILL.md claims must exist in the snapshot) would be
// circular.
//
// Layering (rosetta DESIGN.md "What each store is authoritative for"):
//   - commands.tsv (inspect, versioned) is the CLI/expression layer: verbs and
//     settable inputs per command. Its ros_version is preserved independently.
//   - cliref entries/fields (manual, version-less tree) are the element layer:
//     paths, named fields, settable-vs-read-only (field_kind), package /
//     conditions / syscap. Occurrence identity is (manual_version, entry_id) —
//     source_path repeats across hardware variants and is a coordinate, not an
//     identity. Manual-only entries (null inspect_path) are first-class
//     hardware/package coverage, selected by source_path, never dropped.
//   - Field-to-inspect mapping is many-to-many; inspect links are crosswalk
//     evidence, not identity. Only settable `Argument` rows participate in
//     input validation; a same-name inspect input never validates a
//     `Read-only Argument` output field.
//
// TSV parsing mirrors rosetta's documented contract (manifest [contract] section
// + src/export.ts parseTsv/decodeTsvField): one line per record, tab-separated,
// backslash escapes (\\ \t \n \r), whole-field \N for NULL, empty for "".

const PILOT_SKILL = "routeros-container";

// This builder understands exactly one export contract version. A rosetta bump
// must fail loud here, not slice a misunderstood shape.
const EXPECTED_FORMAT = "rosetta-datasets";
const EXPECTED_FORMAT_VERSION = 2;

// Authored scope: menus whose paths/props this skill's claims may reference.
// A claim outside these prefixes fails check-refs until the scope grows here.
// This mapping is authored community judgment, not export data.
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

// ── minimal manifest.toml reader ─────────────────────────────────────────────
// Reads top-level format/format_version, the [provenance] key = "value" lines,
// and the [[files]] name/rows/columns records used for input verification.
// The manifest carries no SHA-256 for TSV datasets (rows/columns/order are the
// integrity record; hashes exist only for raw source files, which this builder
// does not consume), so verification asserts row counts and column identity.

type ManifestFile = { rows: number; columns: string[] };

const readManifest = (text: string): { format: string; formatVersion: number; provenance: Record<string, string>; files: Map<string, ManifestFile> } => {
	let format = "";
	let formatVersion = NaN;
	const provenance: Record<string, string> = {};
	const files = new Map<string, ManifestFile>();
	let section = "";
	let current: { name: string; rows: number; columns: string[] } | null = null;
	const flush = (): void => {
		if (current !== null && current.name !== "") {
			files.set(current.name, { rows: current.rows, columns: current.columns });
		}
		current = null;
	};
	for (const line of text.split("\n")) {
		const sectionMatch = line.match(/^\[\[(.*)\]\]\s*$/) ?? line.match(/^\[(.*)\]\s*$/);
		if (sectionMatch) {
			flush();
			section = sectionMatch[1];
			if (line.startsWith("[[")) current = { name: "", rows: NaN, columns: [] };
			continue;
		}
		if (section === "" && current === null) {
			const f = line.match(/^format\s*=\s*"(.*)"\s*$/);
			if (f) format = f[1];
			const v = line.match(/^format_version\s*=\s*(\d+)\s*$/);
			if (v) formatVersion = Number(v[1]);
			continue;
		}
		if (section === "provenance") {
			const m = line.match(/^([a-z_]+)\s*=\s*"(.*)"\s*$/);
			if (m) provenance[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
			continue;
		}
		if (current !== null) {
			const n = line.match(/^name\s*=\s*"(.*)"\s*$/);
			if (n) current.name = n[1];
			const r = line.match(/^rows\s*=\s*(\d+)\s*$/);
			if (r) current.rows = Number(r[1]);
			const c = line.match(/^columns\s*=\s*\[(.*)\]\s*$/);
			if (c) {
				current.columns = [...c[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
					m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
				);
			}
		}
	}
	flush();
	return { format, formatVersion, provenance, files };
};

// ── snapshot model ───────────────────────────────────────────────────────────

type SnapshotField = {
	name: string;
	kind: string;
	raw_type: string | null;
	mandatory: string | null;
	unsettable: string | null;
	syscap: string | null;
	description: string | null;
};

type SnapshotFlag = { flag: string; name: string; description: string | null };

type SnapshotOccurrence = {
	manual_version: string;
	entry_id: string;
	source_path: string;
	source_type: string;
	inspect_path: string | null;
	match_kind: string | null;
	package: string | null;
	conditions: string | null;
	syscap: string | null;
	source_url: string | null;
	fields: SnapshotField[];
	flags: SnapshotFlag[];
};

type Snapshot = {
	generator: string;
	skill: string;
	rosetta: {
		release_tag: string;
		schema_version: string;
		source_commit: string;
		built_at: string;
		docs_manual_version: string;
		inspect_versions: string[];
		cliref_tree: string;
		cliref_rows_digest: string;
		format: string;
		format_version: number;
		slice_sha256: string;
	};
	owned_prefixes: string[];
	paths: Record<string, { type: string; description: string | null; args: Record<string, string | null> }>;
	occurrences: SnapshotOccurrence[];
};

const covers = (prefixes: string[], path: string): boolean =>
	prefixes.some((p) => path === p || path.startsWith(`${p}/`));

const snapshotPaths = (skillDir: string): { snapshot: string; md: string } => ({
	snapshot: `${skillDir}/references/rosetta-snapshot.json`,
	md: `${skillDir}/references/cli-reference.md`,
});

// Files this builder consumes, with the manifest identity each must match.
const CONSUMED = [
	"commands.tsv",
	"cli-reference/trees.tsv",
	"cli-reference/entries.tsv",
	"cli-reference/fields.tsv",
	"cli-reference/flags.tsv",
	"cli-reference/pages.tsv",
];

const loadVerified = async (exportDir: string, manifest: Map<string, ManifestFile>, name: string): Promise<TsvTable> => {
	const table = parseTsv(await Bun.file(`${exportDir}/${name}`).text());
	const record = manifest.get(name);
	if (!record) throw new Error(`export manifest has no [[files]] record for ${name}`);
	if (table.rows.length !== record.rows) {
		throw new Error(`${name}: ${table.rows.length} rows on disk, manifest says ${record.rows}`);
	}
	const actual = table.columns.join("\0");
	const expected = record.columns.join("\0");
	if (actual !== expected) {
		throw new Error(`${name}: column mismatch (disk: ${table.columns.join(",")})`);
	}
	return table;
};

const buildSnapshot = async (exportDir: string): Promise<Snapshot> => {
	const manifest = readManifest(await Bun.file(`${exportDir}/manifest.toml`).text());
	if (manifest.format !== EXPECTED_FORMAT || manifest.formatVersion !== EXPECTED_FORMAT_VERSION) {
		throw new Error(
			`${exportDir}/manifest.toml is ${manifest.format} v${manifest.formatVersion}; this builder supports ${EXPECTED_FORMAT} v${EXPECTED_FORMAT_VERSION}`,
		);
	}
	const prov = manifest.provenance;
	for (const k of ["release_tag", "schema_version", "source_commit", "built_at", "docs_manual_version"]) {
		if (!prov[k]) throw new Error(`export manifest [provenance] lacks ${k}`);
	}

	const commands = await loadVerified(exportDir, manifest.files, "commands.tsv");
	const cc = colIndex(commands);
	const trees = await loadVerified(exportDir, manifest.files, "cli-reference/trees.tsv");
	const tc = colIndex(trees);
	const defaultTree = trees.rows.find((r) => r[tc.get("is_default") ?? -1] === "1");
	if (!defaultTree) throw new Error("cli-reference/trees.tsv has no default tree");
	const tree = defaultTree[tc.get("manual_version") ?? -1] as string;
	const digest = defaultTree[tc.get("rows_digest") ?? -1] as string;

	const entries = await loadVerified(exportDir, manifest.files, "cli-reference/entries.tsv");
	const fields = await loadVerified(exportDir, manifest.files, "cli-reference/fields.tsv");
	const flags = await loadVerified(exportDir, manifest.files, "cli-reference/flags.tsv");
	const pages = await loadVerified(exportDir, manifest.files, "cli-reference/pages.tsv");
	const ec = colIndex(entries);
	const fc = colIndex(fields);
	const flagCols = colIndex(flags);
	const pageCols = colIndex(pages);

	const pageUrl = new Map<string, string>();
	for (const r of pages.rows) {
		if (r[pageCols.get("manual_version") ?? -1] !== tree) continue;
		const slug = r[pageCols.get("slug") ?? -1] as string;
		const url = r[pageCols.get("url") ?? -1] as string | null;
		if (slug && url) pageUrl.set(slug, url);
	}

	const snapshot: Snapshot = {
		generator: "scripts/build-refs.ts",
		skill: PILOT_SKILL,
		rosetta: {
			release_tag: prov["release_tag"],
			schema_version: prov["schema_version"],
			source_commit: prov["source_commit"],
			built_at: prov["built_at"],
			docs_manual_version: prov["docs_manual_version"],
			inspect_versions: [],
			cliref_tree: tree,
			cliref_rows_digest: digest,
			format: manifest.format,
			format_version: manifest.formatVersion,
			slice_sha256: "",
		},
		owned_prefixes: [...OWNED_PREFIXES].sort(),
		paths: {},
		occurrences: [],
	};

	const inspectVersions = new Set<string>();
	const pathI = cc.get("path") ?? -1;
	const typeI = cc.get("type") ?? -1;
	const descI = cc.get("description") ?? -1;
	const rosI = cc.get("ros_version") ?? -1;
	for (const r of commands.rows) {
		const path = r[pathI] as string;
		if (!covers(OWNED_PREFIXES, path)) continue;
		const type = r[typeI] as string;
		const desc = r[descI];
		const rosVersion = r[rosI] as string | null;
		if (rosVersion) inspectVersions.add(rosVersion);
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
	snapshot.rosetta.inspect_versions = [...inspectVersions].sort();

	// Occurrences: identity is (manual_version, entry_id). Manual-only entries
	// (null inspect_path) are selected by source_path, never dropped.
	const wanted = new Map<string, (string | null)[]>();
	for (const r of entries.rows) {
		if (r[ec.get("manual_version") ?? -1] !== tree) continue;
		const src = r[ec.get("source_path") ?? -1] as string;
		const insp = r[ec.get("inspect_path") ?? -1] as string | null;
		const covered = insp !== null ? covers(OWNED_PREFIXES, insp) : covers(OWNED_PREFIXES, `/${src}`);
		if (!covered) continue;
		const id = r[ec.get("entry_id") ?? -1] as string;
		wanted.set(`${tree}\0${id}`, r);
	}
	const byEntry = new Map<string, SnapshotOccurrence>();
	for (const [key, r] of wanted) {
		const occurrence: SnapshotOccurrence = {
			manual_version: tree,
			entry_id: r[ec.get("entry_id") ?? -1] as string,
			source_path: r[ec.get("source_path") ?? -1] as string,
			source_type: r[ec.get("source_type") ?? -1] as string,
			inspect_path: r[ec.get("inspect_path") ?? -1] as string | null,
			match_kind: r[ec.get("match_kind") ?? -1] as string | null,
			package: r[ec.get("package") ?? -1] as string | null,
			conditions: r[ec.get("conditions") ?? -1] as string | null,
			syscap: r[ec.get("syscap") ?? -1] as string | null,
			source_url: pageUrl.get(r[ec.get("page_slug") ?? -1] as string) ?? null,
			fields: [],
			flags: [],
		};
		byEntry.set(key, occurrence);
		snapshot.occurrences.push(occurrence);
	}
	for (const r of fields.rows) {
		if (r[fc.get("manual_version") ?? -1] !== tree) continue;
		const occurrence = byEntry.get(`${tree}\0${r[fc.get("entry_id") ?? -1] as string}`);
		if (!occurrence) continue;
		occurrence.fields.push({
			name: r[fc.get("name") ?? -1] as string,
			kind: r[fc.get("field_kind") ?? -1] as string,
			raw_type: r[fc.get("raw_type") ?? -1],
			mandatory: r[fc.get("mandatory") ?? -1],
			unsettable: r[fc.get("unsettable") ?? -1],
			syscap: r[fc.get("syscap") ?? -1],
			description: r[fc.get("description_markdown") ?? -1],
		});
	}
	for (const r of flags.rows) {
		if (r[flagCols.get("manual_version") ?? -1] !== tree) continue;
		const occurrence = byEntry.get(`${tree}\0${r[flagCols.get("entry_id") ?? -1] as string}`);
		if (!occurrence) continue;
		occurrence.flags.push({
			flag: r[flagCols.get("flag") ?? -1] as string,
			name: r[flagCols.get("name") ?? -1] as string,
			description: r[flagCols.get("description_markdown") ?? -1],
		});
	}
	snapshot.occurrences.sort((a, b) => {
		const ka = `${a.source_path}\0${a.entry_id}`;
		const kb = `${b.source_path}\0${b.entry_id}`;
		return ka < kb ? -1 : ka > kb ? 1 : 0;
	});
	// Empty-slice disclosure: every owned prefix must select at least one path
	// or occurrence, so a typo'd prefix or an export gap fails loud at author
	// time instead of shipping a silently narrowed snapshot.
	for (const p of OWNED_PREFIXES) {
		const hitPath = Object.keys(snapshot.paths).some((k) => k === p || k.startsWith(`${p}/`));
		const hitOccurrence = snapshot.occurrences.some((o) => {
			const key = o.inspect_path ?? `/${o.source_path}`;
			return key === p || key.startsWith(`${p}/`);
		});
		if (!hitPath && !hitOccurrence) {
			throw new Error(`owned prefix ${p} selected nothing — typo or export gap?`);
		}
	}
	snapshot.rosetta.slice_sha256 = hashSlice(canonicalPayload(snapshot));
	return snapshot;
};

// Canonical payload: sorted keys at every level. The slice hash covers exactly
// this payload — paths plus occurrences — never the stored hash itself.
const canonicalPayload = (s: Snapshot): string => {
	const paths: Snapshot["paths"] = {};
	for (const p of Object.keys(s.paths).sort()) {
		const args: Record<string, string | null> = {};
		for (const a of Object.keys(s.paths[p].args).sort()) args[a] = s.paths[p].args[a];
		paths[p] = { type: s.paths[p].type, description: s.paths[p].description, args };
	}
	const occurrences = [...s.occurrences].sort((a, b) => {
		const ka = `${a.manual_version}\0${a.entry_id}`;
		const kb = `${b.manual_version}\0${b.entry_id}`;
		return ka < kb ? -1 : ka > kb ? 1 : 0;
	});
	return JSON.stringify({ paths, occurrences });
};

const hashSlice = (canonical: string): string =>
	new Bun.CryptoHasher("sha256").update(canonical).digest("hex");

const serializeSnapshot = (s: Snapshot): string => {
	const payload = JSON.parse(canonicalPayload(s)) as Pick<Snapshot, "paths" | "occurrences">;
	return `${JSON.stringify(
		{
			generator: s.generator,
			skill: s.skill,
			rosetta: s.rosetta,
			owned_prefixes: [...s.owned_prefixes].sort(),
			paths: payload.paths,
			occurrences: payload.occurrences,
		},
		null,
		2,
	)}\n`;
};

const oneLine = (s: string | null): string =>
	(s ?? "—")
		.replace(/\\/g, "\\\\") // escape first, so a literal backslash survives the pipe escape below
		.replace(/\s+/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // manual links have no anchor here; keep the text
		.replace(/\|/g, "\\|")
		.trim()
		.replace(/(^|[\s(])(https?:\/\/\S+?)([).,;!?]*)(?=[\s)]|$)/g, "$1<$2>$3"); // MD034: no bare URLs

const renderMarkdown = (s: Snapshot): string => {
	const lines: string[] = [
		`<!-- GENERATED from rosetta export ${s.rosetta.release_tag} (inspect ${s.rosetta.inspect_versions.join(", ")}, tree ${s.rosetta.cliref_tree}) by ${s.generator} — do not edit by hand. -->`,
		"",
		`# ${s.skill} CLI reference (rosetta ${s.rosetta.release_tag})`,
		"",
		"Generated slice of the rosetta export covering this skill's owned menus. Regenerate with `bun scripts/build-refs.ts --export <dir>`.",
		"",
		"Layers: command paths and settable inputs come from the inspect layer (`commands.tsv`, versioned per release); element fields, settable-vs-read-only kinds, and platform restrictions come from the CLI-reference layer (manual tree, version-less). The owned-menu scope below is authored community judgment, not export data.",
		"",
		"| Provenance | Value |",
		"|---|---|",
		`| release_tag | \`${s.rosetta.release_tag}\` |`,
		`| schema_version | \`${s.rosetta.schema_version}\` |`,
		`| source_commit | \`${s.rosetta.source_commit}\` |`,
		`| built_at | \`${s.rosetta.built_at}\` |`,
		`| docs_manual_version | \`${s.rosetta.docs_manual_version}\` |`,
		`| inspect_versions | \`${s.rosetta.inspect_versions.join(", ")}\` |`,
		`| cliref_tree | \`${s.rosetta.cliref_tree}\` |`,
		`| cliref_rows_digest | \`${s.rosetta.cliref_rows_digest.slice(0, 16)}…\` (whole-tree digest, not a slice checksum) |`,
		`| slice_sha256 | \`${s.rosetta.slice_sha256.slice(0, 16)}…\` (checksum of this slice's paths and occurrences) |`,
		"",
		"## How to use this reference",
		"",
		"- Command sections below are sorted by path; each lists the settable inputs from the inspect layer.",
		"- Occurrences carry manual-layer details: field kinds (settable vs read-only), `Syscap`/`Package`/`Conditions` restrictions, and official-source links.",
		"- Inspect data and manual data carry different versions (see provenance): a property present in one layer may be absent from the other.",
		"- This reference covers names and kinds only; runtime behavior needs a device.",
		"",
		"## Authored scope (not export data)",
		"",
		"The slice covers these owned menu prefixes, authored in `scripts/build-refs.ts`:",
		"",
		...s.owned_prefixes.map((p) => `- \`${p}\``),
		"",
	];
	for (const p of Object.keys(s.paths).sort()) {
		const entry = s.paths[p];
		const argNames = Object.keys(entry.args).sort();
		if (argNames.length === 0 && entry.type !== "cmd") continue;
		lines.push(`## \`${p}\` (inspect ${s.rosetta.inspect_versions.join(", ")})`, "");
		if (entry.description) lines.push(oneLine(entry.description), "");
		if (argNames.length === 0) {
			lines.push("No settable inputs.", "");
			continue;
		}
		lines.push("| Property | Description |", "|---|---|");
		for (const a of argNames) lines.push(`| \`${a}\` | ${oneLine(entry.args[a])} |`);
		lines.push("");
	}
	if (s.occurrences.length > 0) {
		lines.push(`## CLI-reference occurrences (tree ${s.rosetta.cliref_tree})`, "");
		const ordered = [...s.occurrences].sort((a, b) => {
			const ka = `${a.source_path}\0${a.entry_id}`;
			const kb = `${b.source_path}\0${b.entry_id}`;
			return ka < kb ? -1 : ka > kb ? 1 : 0;
		});
		for (const o of ordered) {
			const title = o.inspect_path ?? `/${o.source_path}`;
			const match = o.match_kind ?? "manual-only (no inspect crosswalk)";
			lines.push(`### \`${title}\``, "");
			const meta = [`Type: ${oneLine(o.source_type)}`, `Match: ${oneLine(match)}`];
			if (o.package) meta.push(`Package: \`${o.package}\``);
			if (o.conditions) meta.push(`Conditions: ${oneLine(o.conditions)}`);
			if (o.syscap) meta.push(`Syscap: \`${o.syscap}\``);
			if (o.source_url) meta.push(`[Official source](${o.source_url})`);
			lines.push(meta.join(" · "), "");
			if (o.fields.length > 0) {
				lines.push("| Field | Kind | Type | Description |", "|---|---|---|---|");
				for (const f of o.fields) {
					lines.push(`| \`${f.name}\` | ${oneLine(f.kind)} | ${oneLine(f.raw_type)} | ${oneLine(f.description)} |`);
				}
				lines.push("");
			}
			if (o.flags.length > 0) {
				lines.push("| Flag | Name | Description |", "|---|---|---|");
				for (const f of o.flags) {
					lines.push(`| \`${f.flag}\` | ${oneLine(f.name)} | ${oneLine(f.description)} |`);
				}
				lines.push("");
			}
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
		let parsed: Snapshot | null = null;
		try {
			parsed = JSON.parse(diskSnapshot) as Snapshot;
		} catch {
			fail(`${snapshotPath}: not valid JSON`);
		}
		if (parsed) {
			if (parsed.rosetta?.format !== EXPECTED_FORMAT || parsed.rosetta?.format_version !== EXPECTED_FORMAT_VERSION) {
				fail(`${snapshotPath}: unsupported snapshot contract (want ${EXPECTED_FORMAT} v${EXPECTED_FORMAT_VERSION})`);
			}
			if (serializeSnapshot(parsed) !== diskSnapshot) {
				fail(`${snapshotPath}: formatting drift (re-run --export and commit)`);
			}
			if (JSON.stringify([...parsed.owned_prefixes].sort()) !== JSON.stringify([...OWNED_PREFIXES].sort())) {
				fail(`${snapshotPath}: owned scope differs from scripts/build-refs.ts (re-run --export and commit)`);
			}
			if (hashSlice(canonicalPayload(parsed)) !== parsed.rosetta.slice_sha256) {
				fail(`${snapshotPath}: content hash mismatch — hand-edited or corrupt (re-run --export and commit)`);
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
	let snapshot: Snapshot;
	try {
		snapshot = await buildSnapshot(exportDir as string);
	} catch (e) {
		console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
		process.exit(1);
	}
	await Bun.write(snapshotPath, serializeSnapshot(snapshot));
	await Bun.write(mdPath, renderMarkdown(snapshot));
	const pathCount = Object.keys(snapshot.paths).length;
	const argCount = Object.values(snapshot.paths).reduce((n, p) => n + Object.keys(p.args).length, 0);
	console.log(
		`✓ ${PILOT_SKILL}: ${pathCount} paths, ${argCount} args, ${snapshot.occurrences.length} occurrences from ${snapshot.rosetta.release_tag} (inspect ${snapshot.rosetta.inspect_versions.join(", ")}, tree ${snapshot.rosetta.cliref_tree})`,
	);
}

if (failures > 0) {
	console.error(`\n${failures} reference build error(s)`);
	process.exit(1);
}
if (checkMode) console.log(`✓ ${PILOT_SKILL} references fresh`);
