# Fixture: same-line command wins over earlier lines

<!-- expect: fail -->
<!-- expect-token: /container/config/set -->

`file=` is valid for `/container/add` but not for `/container/config/set`;
the claim sits on the config line and must be judged against it.

```routeros
/container/add file=x.tar
/container/config/set file=y
```
