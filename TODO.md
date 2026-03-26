# TODO

## Research mutable versus immutable query chain building
  7. Mutability — QueryBuilderImpl mutates internal state (_negated, _currentPath, _currentGroup). The chain methods return this, so the builder can't be forked.   
  This is fine for single-use query building, but worth noting compared to the schema module which uses immutable cloning.

 - Query builders are inherently single-use — you build a query, call select()/selectAll(), and you're done. Forking a half-built query is an unusual pattern that rarely comes up in practice.
 - The schema module benefits from immutability because chains are reusable building blocks (e.g. t.str.minLen(3) might be used across multiple schemas). Query builders don't have that reuse pattern.
 - Cloning on every method call (where, and, or, condition methods, orderBy) would add allocation overhead and complexity for no practical gain. The schema module only clones on constraint methods, but a query builder mutates much more frequently per usage.


## Signed
Research Signed/Unsigned/Int/Int32/Positive/Negative/Safe etc.

## Identify if nested objects are a good idea

```typescript
// But nested object fields CANNOT be optional:
const orgSchema = schema(t => ({
  address: {
    street: t.string,
    city: t.string,
  },
}));
```

If we want to support them, there has to be a way to make them nullable


## Document t.str.nullable.array and t.str.array.nullable
They produce different types:

t.str.nullable.array → (string | null)[] — a non-nullable array whose elements can be string | null
t.str.array.nullable → string[] | null — a nullable array whose elements are always string
The .nullable applies to whatever it's chained on. When it comes before .array, it makes the element nullable. When it comes after .array, it makes the whole array nullable.

## t.str.array.beginsWith("A")
This is valid in the IDE but results in a `never` type

## t.str has validate on it
