// ── Base chain: common to all types ──────────────────────────────────

export interface ThBaseChain<T, Self extends ThBaseChain<T, Self>> {
    readonly nullable: Omit<Self, '_type' | 'nullable'> & { readonly _type: T | null };
    test(fn: (value: T) => boolean): Self;
    validate(value: any): boolean;
    /** @internal phantom property for type inference */
    readonly _type: T;
}

// ── String chain ─────────────────────────────────────────────────────

export interface ThStringChain extends ThBaseChain<string, ThStringChain> {
    // Length constraints
    len(n: number): ThStringChain;
    length(n: number): ThStringChain;
    minLen(n: number): ThStringChain;
    maxLen(n: number): ThStringChain;

    // Content constraints
    beginsWith(value: string): ThStringChain;
    endsWith(value: string): ThStringChain;
    contains(value: string): ThStringChain;
    regex(pattern: RegExp): ThStringChain;

    // Tagged template literal
    template(strings: TemplateStringsArray, ...exprs: ThStringChain[]): ThStringChain;

    // Transforms
    uppercase(): ThStringChain;
    lowercase(): ThStringChain;

    // Built-in formats
    readonly email: ThStringChain;
}

// ── Number chain ─────────────────────────────────────────────────────

export interface ThNumberChain extends ThBaseChain<number, ThNumberChain> {
    gt(n: number): ThNumberChain;
    lt(n: number): ThNumberChain;
    gte(n: number): ThNumberChain;
    lte(n: number): ThNumberChain;
    multipleOf(n: number): ThNumberChain;
    readonly unsigned: ThNumberChain;
    readonly signed: ThNumberChain;
}

// ── BigInt chain ─────────────────────────────────────────────────────

export interface ThBigIntChain extends ThBaseChain<bigint, ThBigIntChain> {
    gt(n: bigint): ThBigIntChain;
    lt(n: bigint): ThBigIntChain;
    gte(n: bigint): ThBigIntChain;
    lte(n: bigint): ThBigIntChain;
    multipleOf(n: bigint): ThBigIntChain;
}

// ── Date chain ───────────────────────────────────────────────────────

export interface ThDateChain extends ThBaseChain<Date, ThDateChain> {
    gt(d: Date): ThDateChain;
    lt(d: Date): ThDateChain;
    gte(d: Date): ThDateChain;
    lte(d: Date): ThDateChain;
    min(dateStr: string): ThDateChain;
    max(dateStr: string): ThDateChain;
}

// ── Simple chains (no extra constraints) ─────────────────────────────

export interface ThBooleanChain extends ThBaseChain<boolean, ThBooleanChain> { }
export interface ThSymbolChain extends ThBaseChain<symbol, ThSymbolChain> { }
export interface ThUndefinedChain extends ThBaseChain<undefined, ThUndefinedChain> { }
export interface ThNullChain extends ThBaseChain<null, ThNullChain> { }

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
    literal<T extends (string | number | boolean | symbol)[]>(...values: T): ThBaseChain<T[number], any>;
}

