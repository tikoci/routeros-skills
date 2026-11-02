# Fixture: built-ins need an add/set operation, not just any args

<!-- expect: fail -->
<!-- expect-token: disabled -->

`/container/start` takes `numbers` only: operating on an item is not evidence
for setting `disabled`.

```routeros
/container/start disabled=yes
```
