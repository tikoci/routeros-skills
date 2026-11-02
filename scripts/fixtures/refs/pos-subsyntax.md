# Fixture: quoted value sub-syntax is a mention, not an input

<!-- expect: pass -->
<!-- expect-counts: mention=2 -->

```routeros
/container/add mount="src=disk1/app,dst=/data" interface=veth1
```
