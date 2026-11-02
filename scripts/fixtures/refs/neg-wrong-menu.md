# Fixture: wrong-menu input must fail

<!-- expect: fail -->
<!-- expect-token: registry-url -->

`registry-url` is a `/container/config/set` arg, not a `/container/add` arg.

```routeros
/container/add registry-url=example
```
