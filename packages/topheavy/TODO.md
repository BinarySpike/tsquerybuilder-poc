# TODO

## `template` constraint: use chain builders to inform the regex pattern

Currently, interpolations in `t.str.template` are ignored — every slot emits `.*` regardless
of what is passed:

```ts
t.str.template`INV-${t.str.len(4)}-${t.str.uppercase()}`
// actual regex: /^INV-.*-.*$/
// desired regex: /^INV-.{4}-[A-Z]+$/  (or similar)
```

The interface accepts `any[]` as a stopgap (see `schema.types.ts`). The proper fix is to
translate `ThStringChain` constraint lists into regex fragments so the built pattern actually
reflects the builder.

### Approach

Add a `toRegexFragment(chain: ThStringChain): string` helper that walks
`chain.constraints` and maps known constraint names to regex sub-patterns:

| Constraint      | Regex fragment           |
|-----------------|--------------------------|
| `len(n)`        | `.{n}`                   |
| `minLen(n)`     | `.{n,}`                  |
| `maxLen(n)`     | `.{0,n}`                 |
| `uppercase()`   | `[A-Z\s\d\W]+` (approx) |
| `lowercase()`   | `[a-z\s\d\W]+` (approx) |
| `beginsWith(s)` | `s.*`                    |
| `endsWith(s)`   | `.*s`                    |
| `contains(s)`   | `.*s.*`                  |
| `regex(r)`      | `(?:r.source)`           |
| `email`         | email pattern            |
| _(unknown)_     | `.*` (safe fallback)     |

When `toRegexFragment` is implemented, restore the `exprs` type to `ThStringChain<any>[]`
in the interface and update `template()` in `StringChainBuilder` to call it for each slot.

### Considerations

- Chains with multiple constraints need their fragments composed (e.g. `minLen(3).uppercase()`
  → `.{3,}` filtered to uppercase). Composition can be approximated with lookaheads or a
  best-effort single fragment.
- Non-`ThStringChain` interpolations (raw strings, numbers) should be escaped and used
  literally rather than treated as wildcards, which would make templates more expressive
  (e.g. `` template`${userId}-suffix` `` where `userId` is a plain string).
- The `exprs` type in the interface should become `ThStringChain<any> | string | number`
  to reflect both use cases.
