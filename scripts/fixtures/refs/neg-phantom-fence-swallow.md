# Fixture: fence markers inside comments open no fence

<!-- expect: fail -->
<!-- expect-token: /container/missing -->

<!--
```routeros
-->

Clean prose.

```plain

Later `/container/missing` must fail.
