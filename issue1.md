Issue #1 is about how PathType resolves types when a dotted path traverses through an array field.

Here's the relevant code in path.ts:21-28:


export type PathType<T, P extends string> =
    P extends `${infer Key}.${infer Rest}` ?
    Key extends keyof T ?
        T[Key] extends Array<infer U> ?
            PathType<U, Rest>[] :    // ← wraps result in []
            PathType<T[Key], Rest>
    : never
    : P extends keyof T ? T[P] : never;
When it encounters an array at T[Key], it infers the element type U, recurses with PathType<U, Rest>, and then wraps the result back in []. This is a faithful representation of the data shape — if items is LineItem[], then items.description is indeed string[] at the data level.

But for querying, this is the wrong abstraction. Consider your test data:


// Invoice has: items: t.ref(() => LineItem).array
// LineItem has: description: t.str, quantity: t.num, unitPrice: t.num

const q = query<InvoiceType>().where('items.description');
PathType<InvoiceType, 'items.description'> resolves as:

Key = 'items', Rest = 'description'
T['items'] is LineItem[], so U = LineItem
Recurses: PathType<LineItem, 'description'> = string
Wraps: string[]
So the condition type becomes Condition<string[], R>, which expands to:


BaseCondition<string[], R>     // is(), in(), not
& ArrayCondition<string[], R>  // has(), hasSome(), hasEvery()
// string extends string[]? No → StringCondition is excluded
// number extends string[]? No → NumberCondition is excluded
You get has('foo') and hasSome(['foo', 'bar']), but not beginsWith(), contains(), endsWith(), etc. In a query language, where('items.description').contains('widget') is the natural intent — "find invoices where any line item description contains 'widget'". The current types make that impossible without casting.

The fix would be to not re-wrap in [] when descending through arrays, since the query is targeting element-level values:


export type PathType<T, P extends string> =
    P extends `${infer Key}.${infer Rest}` ?
    Key extends keyof T ?
        T[Key] extends Array<infer U> ?
            PathType<U, Rest> :     // ← no [] wrapper
            PathType<T[Key], Rest>
    : never
    : P extends keyof T ? T[P] : never;
This would make items.description resolve to string, giving access to StringCondition methods. The trade-off is that the type no longer reflects the actual runtime shape of the data (it is an array of strings in the raw object), but for a query builder the element-level type is what matters — you're expressing predicates against element values, not against the collection itself.

If you ever need both behaviors (element-level filtering and collection-level conditions like "array length > 3"), you could introduce a separate path type or a dedicated array-aware condition layer, but for the common case of querying through arrays, dropping the [] wrapper is the right call.