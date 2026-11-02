# Fixture: unclosed brackets continue the logical command

<!-- expect: pass -->
<!-- expect-counts: query=1 -->

```routeros
/container/set [find
tag=example]
```
