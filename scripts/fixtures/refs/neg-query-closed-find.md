# Fixture: assignments after a closed find are inputs, not queries

<!-- expect: fail -->
<!-- expect-token: tag -->

```routeros
/container/set [find where name="example"] tag=example
```
