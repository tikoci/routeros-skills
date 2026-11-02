# Fixture: escaped quote does not flip quote tracking

<!-- expect: fail -->
<!-- expect-token: remote-image -->

The `\"` escape stays inside its span, so `remote-image=` is an input claim
on `/ip/address/add`, where it does not exist.

```routeros
/ip/address/add comment="a\"b" remote-image=x
```
