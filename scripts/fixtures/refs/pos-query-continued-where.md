# Fixture: backslash continuation carries the where clause

<!-- expect: pass -->
<!-- expect-counts: query=1 -->

```routeros
/container/print where \
tag=example
```
