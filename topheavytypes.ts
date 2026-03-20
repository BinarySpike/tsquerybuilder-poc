// ── Base chain: common to all types ──────────────────────────────────

interface ThBaseChain<T, Self extends ThBaseChain<T, Self>> {
    readonly nullable: Self;
    test(fn: (value: T) => boolean): Self;
    /** @internal phantom property for type inference */
    readonly _type: T;
}

// ── String chain ─────────────────────────────────────────────────────

interface ThStringChain extends ThBaseChain<string, ThStringChain> {
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

interface ThNumberChain extends ThBaseChain<number, ThNumberChain> {
    gt(n: number): ThNumberChain;
    lt(n: number): ThNumberChain;
    gte(n: number): ThNumberChain;
    lte(n: number): ThNumberChain;
    multipleOf(n: number): ThNumberChain;
    readonly unsigned: ThNumberChain;
    readonly signed: ThNumberChain;
}

// ── BigInt chain ─────────────────────────────────────────────────────

interface ThBigIntChain extends ThBaseChain<bigint, ThBigIntChain> {
    gt(n: bigint): ThBigIntChain;
    lt(n: bigint): ThBigIntChain;
    gte(n: bigint): ThBigIntChain;
    lte(n: bigint): ThBigIntChain;
    multipleOf(n: bigint): ThBigIntChain;
}

// ── Date chain ───────────────────────────────────────────────────────

interface ThDateChain extends ThBaseChain<Date, ThDateChain> {
    gt(d: Date): ThDateChain;
    lt(d: Date): ThDateChain;
    gte(d: Date): ThDateChain;
    lte(d: Date): ThDateChain;
    min(dateStr: string): ThDateChain;
    max(dateStr: string): ThDateChain;
}

// ── Simple chains (no extra constraints) ─────────────────────────────

interface ThBooleanChain extends ThBaseChain<boolean, ThBooleanChain> { }
interface ThSymbolChain extends ThBaseChain<symbol, ThSymbolChain> { }
interface ThUndefinedChain extends ThBaseChain<undefined, ThUndefinedChain> { }
interface ThNullChain extends ThBaseChain<null, ThNullChain> { }

// ── Type inference utilities ─────────────────────────────────────────

type InferField<F> =
    F extends ThBaseChain<infer T, any> ? T :
    F extends TypeDefinition<infer T> ? T :
    never;

type InferSchema<S> = {
    [K in keyof S]: InferField<S[K]>;
}

// ── TypeDefinition ───────────────────────────────────────────────────

interface TypeDefinition<T = unknown> {
    readonly array: TypeDefinition<T[]>;
    readonly infer: T;
}

// ── ThType: the builder object passed to th() ────────────────────────

interface ThType {
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

// ── th() factory ─────────────────────────────────────────────────────

function th<S extends Record<string, any>>(cb: (t: ThType) => S): TypeDefinition<InferSchema<S>>;
function th(cb: (t: ThType) => void): TypeDefinition;
function th(cb: (t: ThType) => any): TypeDefinition {
    return {} as TypeDefinition;
}

const Customer = th(t => {
    id: t.num;
    companyName: t.str;
    email: t.str.email;
    address: t.string;
})

const LineItem = th(t => {
    description: t.str;
    quantity: t.num;
    unitPrice: t.num;
})

const Invoice = th(t => {
    id: t.num;
    customer: Customer;
    items: LineItem.array;
    dueDate: t.date;
    totalAmount: t.number;
});

type InvoiceType = typeof Invoice.infer

const EverythingElse = th(t => {
    sym: t.sym;
    biggy: t.bigint;
    bool: t.bool;
    undy: t.undefined;
    nully: t.null;
    literally: t.literal(12);
    literate: t.literal("literal", "illiterate");
    tempted: t.string.template`email: ${t.string}`;
})

const stringConstraints = th(t => {
    t.str.nullable
    t.str.len(5)
    t.str.length(5)
    t.str.minLen(3).maxLen(5)



    t.str.beginsWith("to")
    t.str.endsWith("concern")
    t.str.contains("whom it may")
    t.str.regex(/^[a-zA-Z]+$/)
    t.str.template`email: ${t.str}`

    t.str.uppercase();
    t.str.lowercase();
    t.str.email
    t.str.test(str => str == "to whom it may concern");

    t.string // t.string is an alias for t.str

    return { num: t.num }
})

const numConstraints = th(t => {
    t.num.nullable
    t.num.gt(3).lt(5)
    t.num.gte(3).lt(5)
    t.num.multipleOf(5)
    t.num.test(num => num > 3 && num < 5)
    t.num.unsigned
    t.num.signed

    return { num: t.num }
})

const bigIntConstraints = th(t => {
    t.bigInt.nullable
    t.bigInt.gt(3n).lt(5n)
    t.bigInt.gte(3n).lt(5n)
    t.bigInt.multipleOf(5n)
    t.bigInt.test(num => num > 3n && num < 5n)

    return { num: t.bigInt }
})

const dateConstraints = th(t => {
    t.date.nullable
    t.date.gt(new Date()).lt(new Date())
    t.date.gte(new Date()).lt(new Date())
    t.date.min('2024-01-01')
    t.date.max('2024-12-31')
    t.date.test(date => date.getFullYear() === 2024)

    return { date: t.date }
})

const booleanConstraints = th(t => {
    t.bool.nullable
    return { bool: t.bool }
})

const symbolConstraints = th(t => {
    t.sym.nullable
    return { sym: t.sym }
})

const undefinedConstraints = th(t => {
    t.undefined.nullable
    return { undefined: t.undefined }
})

const literalConstraints = th(t => {
    t.literal(12)
    t.literal(1, 2, 3, 4)
    t.literal("literal", "illiterate")
    t.literal(Symbol("test"))
})