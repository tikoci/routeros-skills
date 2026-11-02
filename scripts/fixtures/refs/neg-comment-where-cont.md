# Fixture: comment text opens no clause and continues nothing

<!-- expect: fail -->
<!-- expect-token: tag -->

```routeros
/container/set # filter where \
tag=example
```
