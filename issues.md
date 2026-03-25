Bugs
1. nullable getter mutates the builder in place
schema.ts:43-46


get nullable(): this {
    this.isNullable = true;  // mutates the original
    return this;             // returns the same instance
}
The TypeScript type pretends nullable returns a new ThStringChain<null>, but at runtime it mutates and returns this. This means:


const base = t.str.minLen(3);
const withNull = base.nullable;
// base === withNull (same object, but different TS types)
// base.isNullable is now true — the "base" chain was silently mutated
The email getter (schema.ts:138-142) has the same problem. Fix by making a copy: return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { isNullable: true }), or switch to immutable builder pattern.

2. ./types export points to a non-existent directory
package.json:11-14

The "./types" export references ./dist/types/index.js but the source directory is src/schema/, not src/types/. This is a broken export that would fail at runtime.

3. JSDoc example uses the wrong function name
schema.ts:459


 * const userSchema = th(t => ({   // ← should be schema(t => ({
Design Issues
4. ThDateChain has inconsistent date input types
schema.types.ts:116-127

gt/lt/gte/lte take Date objects, but min/max take string. This is confusing at the API level — users would reasonably expect uniform input. Either unify them to both accept Date | string, or remove the duplicate methods (since gte/lte and min/max are semantically identical).

5. template expression type is misleading
schema.types.ts:53


template(strings: TemplateStringsArray, ...exprs: ThStringChain<any>[]): ThStringChain<Null>;
The type signature implies you pass ThStringChain instances as interpolations (like validators), but the implementation simply replaces any interpolation with .* regardless. Either change the exprs type to any[] to match the runtime, or actually use the chain builders to inform the pattern.

6. SelectResult has a key-collision bug
path.ts:29-32


export type SelectResult<T, P extends any[]> =
    P extends [infer First extends string, ...infer Rest]
    ? { [K in LeafKey<First>]: PathType<T, First> } & SelectResult<T, Rest>
    : {};
If you select('customer.id', 'order.id'), both paths have leaf key id, producing { id: CustomerId } & { id: OrderId }. The intersection silently picks one. The key should incorporate the full path, or be documented as a known limitation.

7. validate(value: T) is typed too strictly on the interface
schema.types.ts:180


validate(value: T): boolean;
The primary use case of a validator is receiving unknown data from an external source. Typing it as T means you can't call it without an explicit cast. It should be validate(value: unknown): boolean (or value: T | unknown via an overload) to double as a type guard.

Code Quality
8. _validateObject has a redundant instanceof chain
schema.ts:412-424

All three branches do the same thing:


if (chain instanceof BaseChainBuilder) {
    if (!chain.validate(value[key])) return false;
} else if (chain instanceof TypeDefinitionImpl) {
    if (!chain.validate(value[key])) return false;
} else if (chain instanceof RefTypeDefinition) {
    if (!chain.validate(value[key])) return false;
}
They all call .validate(). Extract a common interface or type guard and collapse to if (!chain.validate(value[key])) return false.

9. where and andWhere/orWhere use the Function type
query.ts:41


where(pathOrSubquery: string | Function): any {
Function is banned in strict TypeScript (it's an escape hatch). Use (qb: QueryBuilderImpl) => void or the appropriate typed callback.

10. len and length are silent aliases without documentation
schema.ts:65-75

Both do exactly the same thing. Either document this explicitly in the JSDoc, or remove one and keep only len (or length) to avoid API confusion.

11. getConditions() is typed as unknown[] in the interface
query.types.ts:150


getConditions(): unknown[];
The internal Conditions type from query.ts is specific and useful. Exporting it (even as an opaque type alias) would let consumers inspect conditions without casting.

Minor
signed getter adds a constraint but no validator (schema.ts:192-195) — it's a no-op beyond recording the constraint. This is inconsistent with every other constraint method.
_schema is underscore-prefixed but publicly typed — the convention implies it's internal, but it's part of the TypeDefinition interface. If it's meant to be accessible (e.g., for schema introspection), drop the underscore.
createThType() casts as as unknown as ThType (schema.ts:449) — suggests the returned object doesn't fully satisfy ThType without casting. Worth aligning the implementation type with the interface.
