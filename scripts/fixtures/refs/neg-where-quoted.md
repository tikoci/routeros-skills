# Fixture: where inside a quoted value is not a clause

<!-- expect: fail -->
<!-- expect-token: tag -->

`tag=` here is an input claim on `/container/add` (the word "where" sits
inside another prop's quoted value), and `tag` is not an inspect arg there.

```routeros
/container/add comment="where things are" tag=x
```
