# Fixture: every comment word is extracted, not just the first

<!-- expect: fail -->
<!-- expect-token: second-rate -->

```routeros
/container/add file=x.tar
# probe activation-timeout second-rate
```
