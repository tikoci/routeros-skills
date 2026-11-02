# Fixture: hash inside quotes is not a comment

<!-- expect: pass -->
<!-- expect-counts: input=2, mention=0 -->

```routeros
/container/add comment="see#foo-bar" file=x.tar
```
