// ── Base chain: common to all types ──────────────────────────────────
// Null defaults to `never` (non-nullable). `.nullable` sets Null = null,
// and all chain methods propagate Null so `| null` is never lost.

export interface ThBaseChain<T, Null = never> {
    test(fn: (value: T | Null) => boolean): this;
    validate(value: any): boolean;
    /** @internal phantom property for type inference */
    readonly _type: T | Null;
}

// ── String chain ─────────────────────────────────────────────────────

export interface ThStringChain<Null = never> extends ThBaseChain<string, Null> {
    readonly nullable: ThStringChain<null>;

    // Length constraints
    len(n: number): ThStringChain<Null>;
    length(n: number): ThStringChain<Null>;
    minLen(n: number): ThStringChain<Null>;
    maxLen(n: number): ThStringChain<Null>;

    // Content constraints
    beginsWith(value: string): ThStringChain<Null>;
    endsWith(value: string): ThStringChain<Null>;
    contains(value: string): ThStringChain<Null>;
    regex(pattern: RegExp): ThStringChain<Null>;

    // Tagged template literal
    template(strings: TemplateStringsArray, ...exprs: ThStringChain<any>[]): ThStringChain<Null>;

    // Transforms
    uppercase(): ThStringChain<Null>;
    lowercase(): ThStringChain<Null>;

    // Built-in formats
    readonly email: ThStringChain<Null>;
}

// ── Number chain ─────────────────────────────────────────────────────

export interface ThNumberChain<Null = never> extends ThBaseChain<number, Null> {
    readonly nullable: ThNumberChain<null>;

    gt(n: number): ThNumberChain<Null>;
    lt(n: number): ThNumberChain<Null>;
    gte(n: number): ThNumberChain<Null>;
    lte(n: number): ThNumberChain<Null>;
    multipleOf(n: number): ThNumberChain<Null>;
    readonly unsigned: ThNumberChain<Null>;
    readonly signed: ThNumberChain<Null>;
}

// ── BigInt chain ─────────────────────────────────────────────────────

export interface ThBigIntChain<Null = never> extends ThBaseChain<bigint, Null> {
    readonly nullable: ThBigIntChain<null>;

    gt(n: bigint): ThBigIntChain<Null>;
    lt(n: bigint): ThBigIntChain<Null>;
    gte(n: bigint): ThBigIntChain<Null>;
    lte(n: bigint): ThBigIntChain<Null>;
    multipleOf(n: bigint): ThBigIntChain<Null>;
}

// ── Date chain ───────────────────────────────────────────────────────

export interface ThDateChain<Null = never> extends ThBaseChain<Date, Null> {
    readonly nullable: ThDateChain<null>;

    gt(d: Date): ThDateChain<Null>;
    lt(d: Date): ThDateChain<Null>;
    gte(d: Date): ThDateChain<Null>;
    lte(d: Date): ThDateChain<Null>;
    min(dateStr: string): ThDateChain<Null>;
    max(dateStr: string): ThDateChain<Null>;
}

// ── Simple chains (no extra constraints) ─────────────────────────────

export interface ThBooleanChain<Null = never> extends ThBaseChain<boolean, Null> {
    readonly nullable: ThBooleanChain<null>;
}
export interface ThSymbolChain<Null = never> extends ThBaseChain<symbol, Null> {
    readonly nullable: ThSymbolChain<null>;
}
export interface ThUndefinedChain<Null = never> extends ThBaseChain<undefined, Null> {
    readonly nullable: ThUndefinedChain<null>;
}
export interface ThNullChain<Null = never> extends ThBaseChain<null, Null> {
    readonly nullable: ThNullChain<null>;
}

// ── Valid field types (for constraining th() schemas) ────────────────

declare const __thRefBrand: unique symbol;

/** Branded type returned by t.ref() — distinguishes lazy refs from raw TypeDefinitions */
export interface ThRefField<T = unknown> extends TypeDefinition<T> {
    readonly [__thRefBrand]: true;
    readonly array: ThRefField<T[]>;
}

export type ValidThField = ThBaseChain<any, any> | ThRefField<any>;

// ── Type inference utilities ─────────────────────────────────────────

export type InferField<F> =
    F extends { readonly _type: infer T } ? T :
    F extends TypeDefinition<infer T> ? T :
    never;

export type InferSchema<S> = {
    [K in keyof S]: InferField<S[K]>;
}

// ── TypeDefinition ───────────────────────────────────────────────────

export interface TypeDefinition<T = unknown> {
    readonly array: TypeDefinition<T[]>;
    readonly infer: T;
    validate(value: T): boolean;
}

// ── ThType: the builder object passed to th() ────────────────────────

export interface ThType {
    readonly str: ThStringChain;
    readonly string: ThStringChain;
    readonly num: ThNumberChain;
    readonly number: ThNumberChain;
    readonly bool: ThBooleanChain;
    readonly date: ThDateChain;
    readonly sym: ThSymbolChain;
    readonly symbol: ThSymbolChain;
    readonly bigInt: ThBigIntChain;
    readonly bigint: ThBigIntChain;
    readonly undefined: ThUndefinedChain;
    readonly null: ThNullChain;
    literal<T extends (string | number | boolean | symbol)[]>(...values: T): ThBaseChain<T[number]>;
    ref<T>(fn: () => TypeDefinition<T>): ThRefField<T>;
}
