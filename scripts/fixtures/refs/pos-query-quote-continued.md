# Fixture: carried quotes keep the where clause on the logical line

<!-- expect: pass -->

```routeros
/container/print where comment="abc
def" tag=example
```
