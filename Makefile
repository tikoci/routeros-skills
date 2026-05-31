# routeros-skills — symlink management for AI assistant skill dirs.
#
# Each routeros-*/ dir in this repo must be symlinked into BOTH
# ~/.copilot/skills/ and ~/.claude/skills/ or the assistant won't load it.
# (A symlinked skill is still only picked up on a fresh assistant session.)
#
#   make link    # idempotently symlink every routeros-* into both dirs
#   make check   # report any repo skill missing from either dir (non-zero exit)
#   make unlink   # remove this repo's routeros-* symlinks from both dirs
#   make install-hooks  # run `make link` automatically after pull/checkout

REPO    := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
SKILLS  := $(notdir $(wildcard $(REPO)/routeros-*))
TARGETS := $(HOME)/.copilot/skills $(HOME)/.claude/skills

.PHONY: link unlink check install-hooks

link:
	@for t in $(TARGETS); do \
	  mkdir -p "$$t"; \
	  for s in $(SKILLS); do \
	    if [ ! -e "$$t/$$s" ]; then \
	      ln -s "$(REPO)/$$s" "$$t/$$s" && echo "linked  $$t/$$s"; \
	    fi; \
	  done; \
	done; \
	echo "link: done"

unlink:
	@for t in $(TARGETS); do \
	  for s in $(SKILLS); do \
	    if [ -L "$$t/$$s" ]; then rm "$$t/$$s" && echo "removed $$t/$$s"; fi; \
	  done; \
	done; \
	echo "unlink: done"

check:
	@rc=0; \
	for s in $(SKILLS); do \
	  if [ ! -f "$(REPO)/$$s/SKILL.md" ]; then echo "NO SKILL.md: $$s"; rc=1; fi; \
	  for t in $(TARGETS); do \
	    if [ ! -e "$$t/$$s" ]; then echo "MISSING:  $$t/$$s"; rc=1; fi; \
	  done; \
	done; \
	if [ $$rc -eq 0 ]; then echo "check: all $(words $(SKILLS)) skills linked into both dirs"; fi; \
	exit $$rc

install-hooks:
	@chmod +x "$(REPO)/hooks/"* 2>/dev/null || true; \
	git -C "$(REPO)" config core.hooksPath hooks && \
	echo "install-hooks: core.hooksPath -> hooks (post-merge/post-checkout run 'make link')"
