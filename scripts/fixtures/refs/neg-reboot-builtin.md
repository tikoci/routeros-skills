# Fixture: built-ins need a command that takes inputs

<!-- expect: fail -->
<!-- expect-token: disabled -->

`/system/reboot` takes zero args, so even a universal built-in fails here.

```routeros
/system/reboot disabled=yes
```
