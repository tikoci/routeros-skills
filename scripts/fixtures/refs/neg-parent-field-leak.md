# Fixture: directory claims cannot borrow parent element fields

<!-- expect: fail -->
<!-- expect-token: remote-image -->

On `/container/envs`:

```ts
const image = row["remote-image"];
```
