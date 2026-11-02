# Fixture: multi-command block attributes each line

<!-- expect: pass -->
<!-- expect-counts: input=2, exempt=1 -->

```routeros
/system/package/print where name=container
/container/add file=x.tar interface=veth1
```
