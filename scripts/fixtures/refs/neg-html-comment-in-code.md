# Fixture: HTML marker inside code cannot hide later claims

<!-- expect: fail -->
<!-- expect-token: remote-picture -->

```routeros
/container/add comment="<!--"
/container/missing remote-picture=example
```
