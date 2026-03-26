# Issues

## 1. `PathType` wraps array element types in `[]`, breaking query condition resolution

**File:** [path.ts:24-25](packages/topheavy/src/query/path.ts#L24-L25)

When traversing through an array field, `PathType` returns `T[]` instead of `T`. For example, given an `Invoice` with `items: LineItem[]`, the path `items.description` resolves to `string[]` instead of `string`. This means the query condition type for that path is `Condition<string[], R>`, which offers `ArrayCondition` methods (`has`, `hasSome`, `hasEvery`) instead of `StringCondition` methods (`beginsWith`, `contains`, etc.).

In most query languages, filtering on `items.description` means matching against individual element values, not the array as a whole.

```typescript
// Current behavior:
query<InvoiceType>().where('items.description') // → Condition<string[], ...> (array methods)

// Expected behavior for element-level querying:
query<InvoiceType>().where('items.description') // → Condition<string, ...> (string methods)
```

---

## 2. No `BigIntCondition` in query module

**File:** [query.types.ts:97-101](packages/topheavy/src/query/query.types.ts#L97-L101)

The `Condition` type maps `string`, `number`, `Date`, and arrays to specialized condition interfaces, but `bigint` fields only get `BaseCondition` (i.e., `is()`, `in()`, `not`). There are no `greaterThan`, `lessThan`, or `between` operators available for bigint-typed paths, despite the schema module fully supporting bigint constraints (`gt`, `lt`, `gte`, `lte`, `multipleOf`).

---

## 4. `multipleOf` implicitly constrains to integers, not just multiples

**File:** [schema.ts:325](packages/topheavy/src/schema/schema.ts#L325)

```typescript
clone.validators.push((v: any) => Number.isInteger(v) && v % n === 0);
```

The validator requires `Number.isInteger(v)`, so `t.num.multipleOf(5)` rejects `10.0` on engines where `Number.isInteger(10.0)` is `true` (which is actually all JS engines — `10.0 === 10`). However, it does reject `7.5` even though `7.5 % 2.5 === 0`. The name `multipleOf` suggests it should only check divisibility, but the integer guard makes it also a de facto `isInteger` check. The constructor also throws on non-integer arguments, so `multipleOf(0.5)` is impossible despite being mathematically valid.

---

## 6. Inline nested objects cannot be nullable

**File:** [schema.ts:584-605](packages/topheavy/src/schema/schema.ts#L584-L605)

When a field is defined using inline object syntax, `TypeDefinitionImpl` is created for it, but `TypeDefinitionImpl` has no `isNullable` property. The `_validateObject` loop at line 598 checks `chain.isNullable` for missing keys, but a `TypeDefinitionImpl` field will always fail that check, making inline nested objects implicitly required with no way to make them optional.

```typescript
// No way to make this optional:
const s = schema(t => ({
  address: {        // always required — no .nullable available
    street: t.str,
    city: t.str,
  },
}));
```

Workaround: use `t.ref()` instead of inline objects when nullability is needed.

---

## 9. Query builder has no runtime guard against calling `where()` multiple times

**File:** [query.ts:44-55](packages/topheavy/src/query/query.ts#L44-L55)

The type system correctly restricts `where()` to a single initial call (the return type doesn't include `where`). However, at runtime nothing prevents:

```typescript
const q = query<T>() as any;
q.where('a').is(1);
q.where('b').is(2); // silently continues in same group — both conditions end up together
```

Since the builder is used internally and could be exposed in subquery callbacks, a runtime check or explicit state transition would make the single-call contract more robust.

---

## 10. `toRegexFragment` output depends on constraint insertion order

**File:** [schema.ts:164-170](packages/topheavy/src/schema/schema.ts#L164-L170)

When there's no quantifier/charClass and multiple lookahead fragments exist, the last fragment becomes the consuming pattern and all others become lookaheads. This means the regex structure changes depending on whether you write `.beginsWith('A').endsWith('Z')` vs `.endsWith('Z').beginsWith('A')`. Both produce functionally equivalent regexes in most cases, but the behavior is implicit and could lead to subtle bugs if a future constraint depends on the consuming vs lookahead distinction.

---

## 11. Proxy in `PrimitiveArrayChainBuilder` leaks element chain internals

**File:** [schema.ts:80-100](packages/topheavy/src/schema/schema.ts#L80-L100)

The Proxy `get` trap falls through to `return elementVal` (line 98) for any property that isn't on `target`, isn't a function, and isn't a `BaseChainBuilder` instance. This means accessing properties like `.validators` on an array chain returns the element chain's internal validator array, leaking implementation details.

---

## 12. No validation error context — `validate()` returns only `boolean`

**Files:** [schema.ts:46-49](packages/topheavy/src/schema/schema.ts#L46-L49), [schema.ts:576-582](packages/topheavy/src/schema/schema.ts#L576-L582)

All `validate()` methods return `true`/`false` with no information about which field failed or why. For schemas with many fields or deep nesting, debugging validation failures requires manual bisection. Consider a companion method (e.g., `validateWithErrors()`) that returns structured error information.
