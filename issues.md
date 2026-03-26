Bugs / Correctness

3. and/or getters can produce malformed condition groups (query.ts:77-85)
Calling .and or .or at the start of a new path (before any condition on that path) pushes 'and'/'or' at the front of an empty group. E.g., .andWhere('age').and.lessThan(65) would produce ['and', ['age', 'lessThan', 65]] — a group starting with a logical operator, which is malformed.

Similarly, .not sets _negated = true on the instance permanently until a condition method is called. If the user accesses .not without immediately chaining a condition (e.g., stores the query mid-chain), it silently leaks into the next condition.

4. Nested schema fields can never be optional (schema.ts:543-546)

if (!(key in value)) {
    if (chain instanceof BaseChainBuilder && chain.isNullable) continue;
    return false;
}
Only BaseChainBuilder fields (leaf types) can be absent via .nullable. TypeDefinitionImpl and RefTypeDefinition nested schemas are always required. There's no way to mark a nested object field as optional.

Type Safety
5. P type parameter in subquery where overloads is unresolvable (query.types.ts:33, query.types.ts:44)

where<P extends Paths<T>>(subquery: (qb: Subquery<T>) => ChainedQuery<T, PathType<T, P>, EmptyQueryResolver<T>>): ...
P is only present in the return type of the callback, so TypeScript can't meaningfully infer it from a call site. It defaults to Paths<T> (the union of all paths), which defeats the purpose of carrying a specific V type through the chain after a subquery overload.

6. Silent validate skip in _validateObject (schema.ts:540-541)

if (!('validate' in chain && typeof chain.validate === 'function')) continue;
This silently skips schema fields that don't have a validate method, meaning those fields are never validated. Given that all ValidThField types do have validate, this is unreachable in normal usage, but it could mask bugs if unexpected values end up in a schema definition.

Documentation / Typos
7. Doubled "array" in two doc comments
query.types.ts:137: "Array array of dynamically distinct unique values found"
schema.types.ts:171: "Promotes this type into an array array-type validation."
8. JSDoc example uses t.string() but it's a getter (schema.ts:587-591)

* const userSchema = schema(t => ({
*   name: t.string().minLen(3),   // ❌ string is a getter, not a method
*   age: t.number().gte(18)       // ❌ same
Should be t.string.minLen(3) and t.number.gte(18).

Minor Design Notes
No array primitive: Arrays can only be defined via t.ref(() => SomeSchema).array. There's no t.array(t.str) for arrays of primitives, which is a usability gap.
Builder is not reusable: QueryBuilderImpl is stateful and single-use. Once selectAll()/select() is called, the builder can't be branched or reused. This is a common design choice but worth documenting.
DateChain has both gt/lt/gte/lte AND min/max (schema.ts:346-386): min and max are aliases for gte and lte respectively. The duplication is minor but may confuse users about which to prefer.