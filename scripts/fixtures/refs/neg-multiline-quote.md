# Fixture: quote state carries across lines in a fenced command

<!-- expect: fail -->
<!-- expect-token: tag -->

```routeros
/container/set comment="where
example" tag=example
```
