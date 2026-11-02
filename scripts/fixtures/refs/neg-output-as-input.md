# Fixture: output field claimed as input must fail

<!-- expect: fail -->
<!-- expect-token: architecture-name -->

`architecture-name` is a read-only `system/resource` field, not a settable input.

```routeros
/system/resource architecture-name=example
```
