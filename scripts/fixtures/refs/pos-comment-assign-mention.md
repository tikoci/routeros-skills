# Fixture: assigns inside comments are mentions at most

<!-- expect: pass -->

```routeros
/container/add file=x.tar # where registry-url=y
/container/add file=x.tar # pick registry-url~z
```
