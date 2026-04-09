# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```bash
# Build the library
npm run build -w topheavy          # compiles src/ → dist/ via tsc

# Run all tests
npm test                           # runs vitest across all workspaces

# Run tests for the library only
npm test -w topheavy               # or: cd packages/topheavy && npx vitest run

# Run a single test file
cd packages/topheavy && npx vitest run tests/query.test.ts

# Watch mode
cd packages/topheavy && npx vitest

# Docs (website)
npm run docs:dev                   # typedoc + vitepress dev server
npm run docs:build                 # typedoc + vitepress production build
```

## Architecture

This is an npm workspace monorepo (`packages/*`, `apps/*`).

### `packages/topheavy` — the core library

Two independent exports:

**`topheavy/query`** — fluent query builder
- `query<T>()` returns a `QueryBuilderImpl` cast to `Query<T>` (the public interface)
- Conditions are accumulated in `_currentGroup: QueryConditionGroup` (same-path chaining via `.and`/`.or`) and flushed into `_conditions: QueryConditions` when `.andWhere`/`.orWhere`/a resolver is called (`_finalizeGroup`)
- The output condition tree is a plain serializable array: `QueryConditions = (QueryConditionGroup | 'and' | 'or')[]`, where each group is `(QueryConditionLeaf | 'and' | 'or')[]` and each leaf is `[path, operator, value]`
- Negation works via a `_negated` flag that prefixes the next operator with `not.`
- `path.ts` provides the `Paths<T>` and `PathType<T, P>` utility types — `Paths<T>` recursively generates all valid dot-separated string paths into `T` (excluding Date/Array leaves), `PathType<T, P>` resolves the value type at a path (broadcasting through arrays)

**`topheavy/schema`** — runtime type validation
- `schema(t => ({ ... }))` accepts a callback that receives a `ThType` builder object and returns a plain object mapping field names to chain builders
- Each primitive type (`string`, `number`, `bigint`, `date`, `boolean`, `symbol`, `undefined`, `null`) has a corresponding `*ChainBuilder` class extending `BaseChainBuilder`. Each constraint method returns an immutable clone with the validator pushed
- `.nullable` sets `isNullable = true` on the clone; `.array` wraps the builder in `PrimitiveArrayChainBuilder` (or a typed array chain for string/number/bigint/date) using a `Proxy` to forward element-level constraint methods
- `t.ref(() => OtherSchema)` creates a `RefTypeDefinition` with a lazy resolver — used for circular/recursive schema references
- `TypeDefinitionImpl.validate()` is strict: extra keys on the object cause failure; missing non-nullable keys cause failure
- The `template` tagged-template method on strings compiles a regex from `ThStringChain` slot descriptors via `toRegexFragment()`, which converts constraints (len, minLen, uppercase, email, etc.) into regex fragments/lookaheads

### Type system pattern

Both modules follow a **phantom-type + fluent-builder** pattern:
- Runtime classes hold validators/state; TypeScript interfaces (`Query<T>`, `ThStringChain`, etc.) define the public API with all generics
- `_type` is a phantom `declare readonly` property used only for type inference — never accessed at runtime
- `InferSchema<S>` maps a schema shape to its inferred TypeScript type by reading `_type` from each field via `InferField<F>`
- `typeof MySchema.infer` is the idiomatic way to get the TypeScript type from a schema definition

### Key design constraints

- `TypeDefinitionImpl._validateObject` rejects objects with keys not present in the schema (strict mode, no extra properties)
- `.nullable` and `.array` must be called before any constraint method on string/number chains (constraint methods return `*Constrained` types that omit `.nullable`/`.array`)
- `_finalizeGroup` strips trailing `'and'`/`'or'` tokens before flushing a group — prevents dangling operators from abandoned chains

### Test data

`packages/topheavy/tests/testData.ts` defines `Invoice`, `Customer`, `Address`, `LineItem`, and `Business` schemas with cross-references via `t.ref()`. These are the canonical test fixtures used across all test files.
