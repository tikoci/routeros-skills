# routeros-skills — symlink management for AI assistant skill dirs.
#
# Each routeros-*/ dir in this repo must be symlinked into BOTH
# ~/.copilot/skills/, ~/.claude/skills/, and ~/.agents/skills/ or the
# assistant won't load it.
# (A symlinked skill is still only picked up on a fresh assistant session.)
#
#   make link    # idempotently symlink every routeros-* into every target dir
#   make check   # report any missing/wrong/non-symlink target (non-zero exit)
#   make unlink   # remove this repo's routeros-* symlinks from every target dir
#   make install-hooks  # run `make link` automatically after pull/checkout
#   make lint    # run the same lint gate as CI (markdownlint + cspell + skill validator)

REPO    := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
LINKER  := $(REPO)/scripts/link-skills.sh

.PHONY: link unlink check targets install-hooks lint

link:
	@$(LINKER) link

unlink:
	@$(LINKER) unlink

check:
	@$(LINKER) check

targets:
	@$(LINKER) targets

install-hooks:
	@chmod +x "$(REPO)/hooks/"* 2>/dev/null || true; \
	git -C "$(REPO)" config core.hooksPath hooks && \
	echo "install-hooks: core.hooksPath -> hooks (post-merge/post-checkout run 'make link')"

# Same gate CI runs: markdownlint-cli2 + cspell + the SKILL.md validator.
# Requires Bun + a one-time `bun install` (devDeps: cspell, markdownlint-cli2).
lint:
	@cd "$(REPO)" && bun run check

# Offline link + #anchor check (mirrors the CI `links` job). Requires `lychee`
# on PATH (`brew install lychee`). External URLs are skipped — relative links
# and same-/cross-file anchors only.
lint-links:
	@cd "$(REPO)" && lychee --offline --include-fragments --exclude-path node_modules './**/*.md'
