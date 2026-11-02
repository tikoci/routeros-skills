# Fixture: inspector args are not evidence for built-ins

<!-- expect: fail -->
<!-- expect-token: name -->

`/console/inspect` takes inspector arguments only: that is not evidence for
setting `name`.

```routeros
/console/inspect name=example
```
