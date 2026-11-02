# Fixture: singleton sets take no built-in item properties

<!-- expect: fail -->
<!-- expect-token: name -->

`/container/config/set` is singleton global config (no sibling `add`), so
`name=` and `disabled=` are unknown inputs, not export omissions.

```routeros
/container/config/set registry-url=x
/container/config/set name=example
/container/config/set disabled=yes
```
