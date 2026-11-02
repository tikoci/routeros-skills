# Fixture: query state ends at the semicolon command boundary

<!-- expect: fail -->
<!-- expect-token: tag -->

```routeros
/container/print where tag=example; /container/set tag=example
```
