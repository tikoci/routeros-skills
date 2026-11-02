# Fixture: documented-absent fields fail when code reads them

<!-- expect: fail -->
<!-- expect-token: .stopped -->

On `/container`:

```ts
if (row[".stopped"]) deleteContainer();
```
