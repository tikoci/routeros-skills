# Fixture: find predicates on numbers-commands accept built-ins

<!-- expect: pass -->
<!-- expect-counts: exempt=2 -->

```routeros
/container/start [find comment="example"]
/container/envs/remove [find disabled=yes]
```
