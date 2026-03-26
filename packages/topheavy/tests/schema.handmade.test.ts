import { describe, it, expect } from 'vitest';
import { schema } from '../src/schema';
import { Customer, Address, LineItem } from './testData.ts';

describe("schema", () => {
    describe("primitives", () => {
        describe("strings", () => {
            const stringTestType = schema(t => ({
                aStr: t.str,
                begins: t.str.beginsWith("Dear"),
                ends: t.str.endsWith("Sincerly"),
                contain: t.str.contains("I am writing you"),
                five: t.str.len(5),
                low: t.str.lowercase(),
                high: t.str.uppercase(),
                fiveMax: t.str.maxLen(5),
                fiveMin: t.str.minLen(5),
                reg: t.str.regex(/^a$/),
                template: t.str.template`Dear ${t.str},`,
                nullable: t.str.nullable,
                chainedNullable: t.str.nullable.beginsWith("A"),
                aStrArray: t.str.array,
                aStrNullableArray: t.str.nullable.array,
                aStrArrayNullable: t.str.array.nullable,
                aStrArrayChain: t.str.array.beginsWith("A"),
                aTest: t.str.test((v) => v == "Hello"),
                aTestNullable: t.str.nullable.test((v) => v == "Hello"),
                aTestArray: t.str.array.test((v) => v.every(e => e == "Hello")),
                aTestArrayNullable: t.str.array.nullable.test((v) => v?.every(e => e == "Hello") ?? false),
                aTestNullableArray: t.str.nullable.array.test((v) => v.every(e => e === null || e == "Hello")),
            }))

            type stringTest = typeof stringTestType.infer

            const strTest: stringTest = {
                aStr: 'asdf',
                begins: 'Dear',
                ends: 'Sincerly',
                contain: 'I am writing you',
                five: '12345',
                low: 'asdf',
                high: 'ASDF',
                fiveMax: '1234',
                fiveMin: '123456',
                reg: 'a',
                template: 'Dear John,',
                nullable: null,
                chainedNullable: null,
                aStrArray: ["Hi", "Hello"],
                aStrNullableArray: ["hello", null, "world"],
                aStrArrayNullable: ["hiya", "howdy"],
                aStrArrayChain: ["Arnold", "Adam", "Alfred"],
                aTest: "Hello",
                aTestNullable: "Hello",
                aTestArray: ["Hello", "Hello"],
                aTestArrayNullable: ["Hello"],
                aTestNullableArray: ["Hello", null],
            }

            it("validates", () => {
                expect(stringTestType.validate(strTest)).toBe(true);
                
                const test = {...strTest}
                test.aStrNullableArray = [null, null]
                test.aStrArrayNullable = null

                test.aTestNullable = null;
                test.aTestArrayNullable = null;

                expect(stringTestType.validate(test)).toBe(true);
            })

            it("standalone validate — array-level test", () => {
                const strTestType = schema(t => ({
                    items: t.str.nullable.array.test((v) => v[0] == "Hello"),
                }))

                const strTest: typeof strTestType.infer = {
                    items: ["Hello", "World"]
                }

                expect(strTestType.validate(strTest)).toBe(true);
                expect(strTestType.validate({ items: ["World"] })).toBe(false);
            })

            it("Nullable validates with value", () => {
                const test = {...strTest}
                test.nullable = "abcd"
                expect(stringTestType.validate(test)).toBe(true);
            })

            it("chainedNullable validates with appropriate value", () => {
                const test = {...strTest}
                test.nullable = "A valid value"
                expect(stringTestType.validate(test)).toBe(true);
            })

            it("Doesn't Validate: t.str", () => {
                const test = {...strTest}
                test.aStr = (1 as unknown as string)
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.beginsWith", () => {
                const test = {...strTest}
                test.begins = 'Hello World'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.endsWith", () => {
                const test = {...strTest}
                test.ends = 'Regards'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.contains", () => {
                const test = {...strTest}
                test.contain = 'Nothing relevant here'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.len", () => {
                const test = {...strTest}
                test.five = '1234'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.lowercase", () => {
                const test = {...strTest}
                test.low = 'UPPER'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.uppercase", () => {
                const test = {...strTest}
                test.high = 'lower'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.maxLen", () => {
                const test = {...strTest}
                test.fiveMax = '123456'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.minLen", () => {
                const test = {...strTest}
                test.fiveMin = '1234'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.regex", () => {
                const test = {...strTest}
                test.reg = 'b'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.template", () => {
                const test = {...strTest}
                test.template = 'Hello John,'
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nullable of wrong type", () => {
                const test = {...strTest}
                test.nullable = (1 as unknown as string)
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: chained nullable failing constraint", () => {
                const test = {...strTest}
                test.chainedNullable = "Not valid"
                expect(stringTestType.validate(test)).toBe(false);
            })
            
            it("Doesn't Validate: string array", () => {
                const test = {...strTest}
                test.aStrArray = "hello" as unknown as string[]
                expect(stringTestType.validate(test)).toBe(false);
            })
            
            it("Doesn't Validate: (string | null)[])", () => {
                const test = {...strTest}
                test.aStrNullableArray = null as unknown as null[]
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: string[] | null", () => {
                const test = {...strTest}
                
                test.aStrArrayNullable = [null, null] as unknown as string[]
                expect(stringTestType.validate(test)).toBe(false);

                test.aStrArrayNullable = "hello" as unknown as null
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: string array chain condition", () => {
                const test = {...strTest}
                test.aStrArrayChain = ["Alfred", "Nathan"]
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: str test", () => {
                const test = {...strTest}
                test.aTest = "Goodbye"
                expect(stringTestType.validate(test)).toBe(false);
            })
            
            it("Doesn't Validate: str test", () => {
                const test = {...strTest}

                test.aTestNullable = "Goodbye"
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestNullable = 1 as unknown as string
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestNullable = 1 as unknown as null
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: str test", () => {
                const test = {...strTest}
                test.aTestArray = ["Goodbye"]
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestArray = 1 as unknown as string[]
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: str test", () => {
                const test = {...strTest}
                test.aTestArrayNullable = ["Goodbye"]
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = 1 as unknown as string[]
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = 1 as unknown as null
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: str test", () => {
                const test = {...strTest}
                test.aTestNullableArray = ["Goodbye"]
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestNullableArray = 1 as unknown as string[]
                expect(stringTestType.validate(test)).toBe(false);

                test.aTestNullableArray = 1 as unknown as null[]
                expect(stringTestType.validate(test)).toBe(false);
            })

            it("validates: t.str.email", () => {
                const emailType = schema(t => ({ email: t.str.email }))
                expect(emailType.validate({ email: 'user@example.com' })).toBe(true);
                expect(emailType.validate({ email: 'user+tag@sub.domain.org' })).toBe(true);
            })

            it("Doesn't Validate: t.str.email — invalid address", () => {
                const emailType = schema(t => ({ email: t.str.email }))
                expect(emailType.validate({ email: 'not-an-email' })).toBe(false);
                expect(emailType.validate({ email: 'missing@' })).toBe(false);
                expect(emailType.validate({ email: '@nodomain.com' })).toBe(false);
                expect(emailType.validate({ email: '' })).toBe(false);
            })

        })

        describe("numbers", () => {
            const numTestType = schema(t => ({
                aNum: t.num,
                greater: t.num.gt(5),
                less: t.num.lt(10),
                greaterEq: t.num.gte(5),
                lessEq: t.num.lte(10),
                multiple: t.num.multipleOf(3),
                nullable: t.num.nullable,
                chainedNullable: t.num.nullable.gt(0),
                aNumArray: t.num.array,
                aNumNullableArray: t.num.nullable.array,
                aNumArrayNullable: t.num.array.nullable,
                aNumArrayChain: t.num.array.gte(0),
                aTest: t.num.test((v) => v === 42),
                aTestNullable: t.num.nullable.test((v) => v === 42),
                aTestArray: t.num.array.test((v) => v.every(e => e === 42)),
                aTestArrayNullable: t.num.array.nullable.test((v) => v?.every(e => e === 42) ?? false),
                aTestNullableArray: t.num.nullable.array.test((v) => v.every(e => e === null || e === 42)),
            }))

            type numTest = typeof numTestType.infer

            const numVal: numTest = {
                aNum: 1,
                greater: 6,
                less: 9,
                greaterEq: 5,
                lessEq: 10,
                multiple: 9,
                nullable: null,
                chainedNullable: null,
                aNumArray: [1, 2, 3],
                aNumNullableArray: [1, null, 3],
                aNumArrayNullable: [1, 2, 3],
                aNumArrayChain: [0, 1, 100],
                aTest: 42,
                aTestNullable: 42,
                aTestArray: [42, 42],
                aTestArrayNullable: [42],
                aTestNullableArray: [42, null],
            }

            it("validates", () => {
                expect(numTestType.validate(numVal)).toBe(true);

                const test = {...numVal}
                test.aNumNullableArray = [null, null]
                test.aNumArrayNullable = null
                test.aTestNullable = null
                test.aTestArrayNullable = null

                expect(numTestType.validate(test)).toBe(true);
            })

            it("Nullable validates with value", () => {
                const test = {...numVal}
                test.nullable = 42
                expect(numTestType.validate(test)).toBe(true);
            })

            it("chainedNullable validates with appropriate value", () => {
                const test = {...numVal}
                test.chainedNullable = 5
                expect(numTestType.validate(test)).toBe(true);
            })

            it("Doesn't Validate: nullable of wrong type", () => {
                const test = {...numVal}
                test.nullable = ('oops' as unknown as number)
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: chained nullable failing constraint", () => {
                const test = {...numVal}
                test.chainedNullable = 0
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num", () => {
                const test = {...numVal}
                test.aNum = ('not a number' as unknown as number)
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num.gt", () => {
                const test = {...numVal}
                test.greater = 5
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num.lt", () => {
                const test = {...numVal}
                test.less = 10
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num.gte", () => {
                const test = {...numVal}
                test.greaterEq = 4
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num.lte", () => {
                const test = {...numVal}
                test.lessEq = 11
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num.multipleOf", () => {
                const test = {...numVal}
                test.multiple = 7
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: number array", () => {
                const test = {...numVal}
                test.aNumArray = 1 as unknown as number[]
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: (number | null)[]", () => {
                const test = {...numVal}
                test.aNumNullableArray = null as unknown as null[]
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: number[] | null", () => {
                const test = {...numVal}
                test.aNumArrayNullable = ['x'] as unknown as number[]
                expect(numTestType.validate(test)).toBe(false);

                test.aNumArrayNullable = 1 as unknown as null
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: number array chain condition", () => {
                const test = {...numVal}
                test.aNumArrayChain = [-1, 0, 1]
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: num test", () => {
                const test = {...numVal}
                test.aTest = 0
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: num nullable test", () => {
                const test = {...numVal}
                test.aTestNullable = 0
                expect(numTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as number
                expect(numTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as null
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: num array test", () => {
                const test = {...numVal}
                test.aTestArray = [0]
                expect(numTestType.validate(test)).toBe(false);

                test.aTestArray = 1 as unknown as number[]
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: num array nullable test", () => {
                const test = {...numVal}
                test.aTestArrayNullable = [0]
                expect(numTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = 1 as unknown as number[]
                expect(numTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = 1 as unknown as null
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: num nullable array test", () => {
                const test = {...numVal}
                test.aTestNullableArray = [0]
                expect(numTestType.validate(test)).toBe(false);

                test.aTestNullableArray = 1 as unknown as number[]
                expect(numTestType.validate(test)).toBe(false);

                test.aTestNullableArray = 1 as unknown as null[]
                expect(numTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: NaN fails t.num", () => {
                const test = {...numVal}
                test.aNum = NaN
                expect(numTestType.validate(test)).toBe(false);
            })

            it("t.num.multipleOf throws TypeError for non-integer argument", () => {
                expect(() => schema(t => ({ n: t.num.multipleOf(1.5) }))).toThrow(TypeError);
            })
        })

        describe("bigints", () => {
            const bigIntTestType = schema(t => ({
                aBigInt: t.bigInt,
                greater: t.bigInt.gt(5n),
                less: t.bigInt.lt(10n),
                greaterEq: t.bigInt.gte(5n),
                lessEq: t.bigInt.lte(10n),
                multiple: t.bigInt.multipleOf(3n),
                nullable: t.bigInt.nullable,
                chainedNullable: t.bigInt.nullable.gt(0n),
                aBigIntArray: t.bigInt.array,
                aBigIntNullableArray: t.bigInt.nullable.array,
                aBigIntArrayNullable: t.bigInt.array.nullable,
                aBigIntArrayChain: t.bigInt.array.gte(0n),
                aTest: t.bigInt.test((v) => v === 42n),
                aTestNullable: t.bigInt.nullable.test((v) => v === 42n),
                aTestArray: t.bigInt.array.test((v) => v.every(e => e === 42n)),
                aTestArrayNullable: t.bigInt.array.nullable.test((v) => v?.every(e => e === 42n) ?? false),
                aTestNullableArray: t.bigInt.nullable.array.test((v) => v.every(e => e === null || e === 42n)),
            }))

            type bigIntTest = typeof bigIntTestType.infer

            const bigIntVal: bigIntTest = {
                aBigInt: 1n,
                greater: 6n,
                less: 9n,
                greaterEq: 5n,
                lessEq: 10n,
                multiple: 9n,
                nullable: null,
                chainedNullable: null,
                aBigIntArray: [1n, 2n, 3n],
                aBigIntNullableArray: [1n, null, 3n],
                aBigIntArrayNullable: [1n, 2n, 3n],
                aBigIntArrayChain: [0n, 1n, 100n],
                aTest: 42n,
                aTestNullable: 42n,
                aTestArray: [42n, 42n],
                aTestArrayNullable: [42n],
                aTestNullableArray: [42n, null],
            }

            it("validates", () => {
                expect(bigIntTestType.validate(bigIntVal)).toBe(true);

                const test = {...bigIntVal}
                test.aBigIntNullableArray = [null, null]
                test.aBigIntArrayNullable = null
                test.aTestNullable = null
                test.aTestArrayNullable = null

                expect(bigIntTestType.validate(test)).toBe(true);
            })

            it("Nullable validates with value", () => {
                const test = {...bigIntVal}
                test.nullable = 42n
                expect(bigIntTestType.validate(test)).toBe(true);
            })

            it("chainedNullable validates with appropriate value", () => {
                const test = {...bigIntVal}
                test.chainedNullable = 5n
                expect(bigIntTestType.validate(test)).toBe(true);
            })

            it("Doesn't Validate: nullable of wrong type", () => {
                const test = {...bigIntVal}
                test.nullable = (1 as unknown as bigint)
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: chained nullable failing constraint", () => {
                const test = {...bigIntVal}
                test.chainedNullable = 0n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.bigInt", () => {
                const test = {...bigIntVal}
                test.aBigInt = (1 as unknown as bigint)
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.bigInt.gt", () => {
                const test = {...bigIntVal}
                test.greater = 5n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.bigInt.lt", () => {
                const test = {...bigIntVal}
                test.less = 10n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.bigInt.gte", () => {
                const test = {...bigIntVal}
                test.greaterEq = 4n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.bigInt.lte", () => {
                const test = {...bigIntVal}
                test.lessEq = 11n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.bigInt.multipleOf", () => {
                const test = {...bigIntVal}
                test.multiple = 7n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint array", () => {
                const test = {...bigIntVal}
                test.aBigIntArray = 1n as unknown as bigint[]
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: (bigint | null)[]", () => {
                const test = {...bigIntVal}
                test.aBigIntNullableArray = null as unknown as null[]
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint[] | null", () => {
                const test = {...bigIntVal}
                test.aBigIntArrayNullable = [1 as unknown as bigint]
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aBigIntArrayNullable = 1n as unknown as null
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint array chain condition", () => {
                const test = {...bigIntVal}
                test.aBigIntArrayChain = [-1n, 0n, 1n]
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint test", () => {
                const test = {...bigIntVal}
                test.aTest = 0n
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint nullable test", () => {
                const test = {...bigIntVal}
                test.aTestNullable = 0n
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as bigint
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as null
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint array test", () => {
                const test = {...bigIntVal}
                test.aTestArray = [0n]
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestArray = 1n as unknown as bigint[]
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint array nullable test", () => {
                const test = {...bigIntVal}
                test.aTestArrayNullable = [0n]
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = 1n as unknown as bigint[]
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = 1n as unknown as null
                expect(bigIntTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bigint nullable array test", () => {
                const test = {...bigIntVal}
                test.aTestNullableArray = [0n]
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestNullableArray = 1n as unknown as bigint[]
                expect(bigIntTestType.validate(test)).toBe(false);

                test.aTestNullableArray = 1n as unknown as null[]
                expect(bigIntTestType.validate(test)).toBe(false);
            })
        })

        describe("dates", () => {
            const epoch  = new Date(0)
            const past   = new Date('2000-01-01')
            const mid    = new Date('2024-01-01')
            const future = new Date('2099-01-01')

            const dateTestType = schema(t => ({
                aDate: t.date,
                after: t.date.gt(epoch),
                before: t.date.lt(future),
                onOrAfter: t.date.gte(mid),
                onOrBefore: t.date.lte(future),
                nullable: t.date.nullable,
                chainedNullable: t.date.nullable.gt(epoch),
                aDateArray: t.date.array,
                aDateNullableArray: t.date.nullable.array,
                aDateArrayNullable: t.date.array.nullable,
                aDateArrayChain: t.date.array.gt(epoch),
                aTest: t.date.test((v) => v >= mid),
                aTestNullable: t.date.nullable.test((v) => v !== null && v >= mid),
                aTestArray: t.date.array.test((v) => v.every(e => e >= mid)),
                aTestArrayNullable: t.date.array.nullable.test((v) => v?.every(e => e >= mid) ?? false),
                aTestNullableArray: t.date.nullable.array.test((v) => v.every(e => e === null || e >= mid)),
            }))

            type dateTest = typeof dateTestType.infer

            const dateVal: dateTest = {
                aDate: mid,
                after: past,
                before: mid,
                onOrAfter: mid,
                onOrBefore: mid,
                nullable: null,
                chainedNullable: null,
                aDateArray: [mid, future],
                aDateNullableArray: [mid, null, future],
                aDateArrayNullable: [mid, future],
                aDateArrayChain: [past, mid, future],
                aTest: mid,
                aTestNullable: mid,
                aTestArray: [mid, future],
                aTestArrayNullable: [mid],
                aTestNullableArray: [mid, null],
            }

            it("validates", () => {
                expect(dateTestType.validate(dateVal)).toBe(true);

                const test = {...dateVal}
                test.aDateNullableArray = [null, null]
                test.aDateArrayNullable = null
                test.aTestNullable = null
                test.aTestArrayNullable = null

                expect(dateTestType.validate(test)).toBe(true);
            })

            it("Nullable validates with value", () => {
                const test = {...dateVal}
                test.nullable = mid
                expect(dateTestType.validate(test)).toBe(true);
            })

            it("chainedNullable validates with appropriate value", () => {
                const test = {...dateVal}
                test.chainedNullable = mid
                expect(dateTestType.validate(test)).toBe(true);
            })

            it("Doesn't Validate: nullable of wrong type", () => {
                const test = {...dateVal}
                test.nullable = ('not a date' as unknown as Date)
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: chained nullable failing constraint", () => {
                const test = {...dateVal}
                test.chainedNullable = epoch
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.date", () => {
                const test = {...dateVal}
                test.aDate = ('not a date' as unknown as Date)
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.date.gt", () => {
                const test = {...dateVal}
                test.after = epoch
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.date.lt", () => {
                const test = {...dateVal}
                test.before = future
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.date.gte", () => {
                const test = {...dateVal}
                test.onOrAfter = past
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.date.lte", () => {
                const test = {...dateVal}
                test.onOrBefore = new Date('2100-01-01')
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date array", () => {
                const test = {...dateVal}
                test.aDateArray = mid as unknown as Date[]
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: (Date | null)[]", () => {
                const test = {...dateVal}
                test.aDateNullableArray = null as unknown as null[]
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: Date[] | null", () => {
                const test = {...dateVal}
                test.aDateArrayNullable = ['not a date'] as unknown as Date[]
                expect(dateTestType.validate(test)).toBe(false);

                test.aDateArrayNullable = mid as unknown as null
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date array chain condition", () => {
                const test = {...dateVal}
                test.aDateArrayChain = [epoch]
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date test", () => {
                const test = {...dateVal}
                test.aTest = past
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date nullable test", () => {
                const test = {...dateVal}
                test.aTestNullable = past
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as Date
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as null
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date array test", () => {
                const test = {...dateVal}
                test.aTestArray = [past]
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestArray = mid as unknown as Date[]
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date array nullable test", () => {
                const test = {...dateVal}
                test.aTestArrayNullable = [past]
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = mid as unknown as Date[]
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = mid as unknown as null
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: date nullable array test", () => {
                const test = {...dateVal}
                test.aTestNullableArray = [past]
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestNullableArray = mid as unknown as Date[]
                expect(dateTestType.validate(test)).toBe(false);

                test.aTestNullableArray = mid as unknown as null[]
                expect(dateTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: invalid Date fails t.date", () => {
                const test = {...dateVal}
                test.aDate = new Date('not-a-date')
                expect(dateTestType.validate(test)).toBe(false);
            })
        })

        describe("booleans", () => {
            const boolTestType = schema(t => ({
                aBool: t.bool,
                nullable: t.bool.nullable,
                aBoolArray: t.bool.array,
                aBoolNullableArray: t.bool.nullable.array,
                aBoolArrayNullable: t.bool.array.nullable,
                aTest: t.bool.test((v) => v === true),
                aTestNullable: t.bool.nullable.test((v) => v === true),
                aTestArray: t.bool.array.test((v) => v.every(e => e === true)),
                aTestArrayNullable: t.bool.array.nullable.test((v) => v?.every(e => e === true) ?? false),
                aTestNullableArray: t.bool.nullable.array.test((v) => v.every(e => e === null || e === true)),
            }))

            type boolTest = typeof boolTestType.infer

            const boolVal: boolTest = {
                aBool: true,
                nullable: null,
                aBoolArray: [true, false],
                aBoolNullableArray: [true, null, false],
                aBoolArrayNullable: [true, false],
                aTest: true,
                aTestNullable: true,
                aTestArray: [true, true],
                aTestArrayNullable: [true],
                aTestNullableArray: [true, null],
            }

            it("validates", () => {
                expect(boolTestType.validate(boolVal)).toBe(true);

                const test = {...boolVal}
                test.aBoolNullableArray = [null, null]
                test.aBoolArrayNullable = null
                test.aTestNullable = null
                test.aTestArrayNullable = null

                expect(boolTestType.validate(test)).toBe(true);
            })

            it("Nullable validates with value", () => {
                const test = {...boolVal}
                test.nullable = false
                expect(boolTestType.validate(test)).toBe(true);
            })

            it("Doesn't Validate: t.bool", () => {
                const test = {...boolVal}
                test.aBool = (1 as unknown as boolean)
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nullable of wrong type", () => {
                const test = {...boolVal}
                test.nullable = (1 as unknown as boolean)
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bool array", () => {
                const test = {...boolVal}
                test.aBoolArray = true as unknown as boolean[]
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: (boolean | null)[]", () => {
                const test = {...boolVal}
                test.aBoolNullableArray = null as unknown as null[]
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: boolean[] | null", () => {
                const test = {...boolVal}
                test.aBoolArrayNullable = [1 as unknown as boolean]
                expect(boolTestType.validate(test)).toBe(false);

                test.aBoolArrayNullable = true as unknown as null
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bool test", () => {
                const test = {...boolVal}
                test.aTest = false
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bool nullable test", () => {
                const test = {...boolVal}
                test.aTestNullable = false
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestNullable = 1 as unknown as boolean
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestNullable = 1 as unknown as null
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bool array test", () => {
                const test = {...boolVal}
                test.aTestArray = [false]
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestArray = true as unknown as boolean[]
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bool array nullable test", () => {
                const test = {...boolVal}
                test.aTestArrayNullable = [false]
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = true as unknown as boolean[]
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = true as unknown as null
                expect(boolTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: bool nullable array test", () => {
                const test = {...boolVal}
                test.aTestNullableArray = [false]
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestNullableArray = true as unknown as boolean[]
                expect(boolTestType.validate(test)).toBe(false);

                test.aTestNullableArray = true as unknown as null[]
                expect(boolTestType.validate(test)).toBe(false);
            })
        })

        describe("symbols", () => {
            const sym1 = Symbol('a')
            const sym2 = Symbol('b')

            const symTestType = schema(t => ({
                aSym: t.sym,
                nullable: t.sym.nullable,
                aSymArray: t.sym.array,
                aSymNullableArray: t.sym.nullable.array,
                aSymArrayNullable: t.sym.array.nullable,
                aTest: t.sym.test((v) => v === sym1),
                aTestNullable: t.sym.nullable.test((v) => v === sym1),
                aTestArray: t.sym.array.test((v) => v.every(e => e === sym1)),
                aTestArrayNullable: t.sym.array.nullable.test((v) => v?.every(e => e === sym1) ?? false),
                aTestNullableArray: t.sym.nullable.array.test((v) => v.every(e => e === null || e === sym1)),
            }))

            type symTest = typeof symTestType.infer

            const symVal: symTest = {
                aSym: Symbol('test'),
                nullable: null,
                aSymArray: [sym1, sym2],
                aSymNullableArray: [sym1, null, sym2],
                aSymArrayNullable: [sym1, sym2],
                aTest: sym1,
                aTestNullable: sym1,
                aTestArray: [sym1, sym1],
                aTestArrayNullable: [sym1],
                aTestNullableArray: [sym1, null],
            }

            it("validates", () => {
                expect(symTestType.validate(symVal)).toBe(true);

                const test = {...symVal}
                test.aSymNullableArray = [null, null]
                test.aSymArrayNullable = null
                test.aTestNullable = null
                test.aTestArrayNullable = null

                expect(symTestType.validate(test)).toBe(true);
            })

            it("Nullable validates with value", () => {
                const test = {...symVal}
                test.nullable = Symbol('optional')
                expect(symTestType.validate(test)).toBe(true);
            })

            it("Doesn't Validate: t.sym", () => {
                const test = {...symVal}
                test.aSym = ('not a symbol' as unknown as symbol)
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nullable of wrong type", () => {
                const test = {...symVal}
                test.nullable = ('not a symbol' as unknown as symbol)
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: symbol array", () => {
                const test = {...symVal}
                test.aSymArray = sym1 as unknown as symbol[]
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: (symbol | null)[]", () => {
                const test = {...symVal}
                test.aSymNullableArray = null as unknown as null[]
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: symbol[] | null", () => {
                const test = {...symVal}
                test.aSymArrayNullable = ['x'] as unknown as symbol[]
                expect(symTestType.validate(test)).toBe(false);

                test.aSymArrayNullable = sym1 as unknown as null
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: sym test", () => {
                const test = {...symVal}
                test.aTest = sym2
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: sym nullable test", () => {
                const test = {...symVal}
                test.aTestNullable = sym2
                expect(symTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as symbol
                expect(symTestType.validate(test)).toBe(false);

                test.aTestNullable = 'bad' as unknown as null
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: sym array test", () => {
                const test = {...symVal}
                test.aTestArray = [sym2]
                expect(symTestType.validate(test)).toBe(false);

                test.aTestArray = sym1 as unknown as symbol[]
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: sym array nullable test", () => {
                const test = {...symVal}
                test.aTestArrayNullable = [sym2]
                expect(symTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = sym1 as unknown as symbol[]
                expect(symTestType.validate(test)).toBe(false);

                test.aTestArrayNullable = sym1 as unknown as null
                expect(symTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: sym nullable array test", () => {
                const test = {...symVal}
                test.aTestNullableArray = [sym2]
                expect(symTestType.validate(test)).toBe(false);

                test.aTestNullableArray = sym1 as unknown as symbol[]
                expect(symTestType.validate(test)).toBe(false);

                test.aTestNullableArray = sym1 as unknown as null[]
                expect(symTestType.validate(test)).toBe(false);
            })
        })

        describe("literals", () => {
            const literalTestType = schema(t => ({
                status: t.literal('active', 'inactive', 'pending'),
                code: t.literal(1, 2, 3),
            }))

            type literalTest = typeof literalTestType.infer

            const literalVal: literalTest = {
                status: 'active',
                code: 1,
            }

            it("validates", () => {
                expect(literalTestType.validate(literalVal)).toBe(true);
            })

            it("Doesn't Validate: t.literal (string)", () => {
                const test = {...literalVal}
                test.status = ('deleted' as unknown as 'active')
                expect(literalTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.literal (number)", () => {
                const test = {...literalVal}
                test.code = (99 as unknown as 1)
                expect(literalTestType.validate(test)).toBe(false);
            })

            it("validates: t.literal with booleans", () => {
                const boolLiteralType = schema(t => ({ flag: t.literal(true, false) }))
                expect(boolLiteralType.validate({ flag: true })).toBe(true);
                expect(boolLiteralType.validate({ flag: false })).toBe(true);
                expect(boolLiteralType.validate({ flag: (1 as unknown as boolean) })).toBe(false);
            })

            it("validates: t.literal.nullable", () => {
                const nullableLiteralType = schema(t => ({ status: (t.literal('active', 'inactive') as any).nullable }))
                expect(nullableLiteralType.validate({ status: 'active' })).toBe(true);
                expect(nullableLiteralType.validate({ status: null })).toBe(true);
                expect(nullableLiteralType.validate({})).toBe(true);
                expect(nullableLiteralType.validate({ status: 'deleted' })).toBe(false);
            })

            it("validates: t.literal.array", () => {
                const arrayLiteralType = schema(t => ({ statuses: (t.literal('active', 'inactive') as any).array }))
                expect(arrayLiteralType.validate({ statuses: ['active', 'inactive'] })).toBe(true);
                expect(arrayLiteralType.validate({ statuses: [] })).toBe(true);
                expect(arrayLiteralType.validate({ statuses: ['deleted'] })).toBe(false);
                expect(arrayLiteralType.validate({ statuses: 'active' as any })).toBe(false);
            })
        })

        describe("undefined", () => {
            const undefinedTestType = schema(t => ({
                aUndef: t.undefined,
                nullable: t.undefined.nullable,
                anUndefArray: t.undefined.array,
                aTest: t.undefined.test((v) => v === undefined),
            }))

            type undefinedTest = typeof undefinedTestType.infer

            const undefinedVal: undefinedTest = {
                aUndef: undefined,
                nullable: null,
                anUndefArray: [undefined, undefined],
                aTest: undefined,
            }

            it("validates", () => {
                expect(undefinedTestType.validate(undefinedVal)).toBe(true);
            })

            it("Nullable validates with undefined value", () => {
                const test = {...undefinedVal}
                test.nullable = undefined
                expect(undefinedTestType.validate(test)).toBe(true);
            })

            it("Nullable validates when key is absent", () => {
                expect(undefinedTestType.validate({
                    aUndef: undefined,
                    anUndefArray: [],
                    aTest: undefined,
                })).toBe(true);
            })

            it("Doesn't Validate: t.undefined — null instead of undefined", () => {
                const test = {...undefinedVal}
                test.aUndef = (null as unknown as undefined)
                expect(undefinedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.undefined — non-undefined value", () => {
                const test = {...undefinedVal}
                test.aUndef = ('hello' as unknown as undefined)
                expect(undefinedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: undefined array — not an array", () => {
                const test = {...undefinedVal}
                test.anUndefArray = (undefined as unknown as undefined[])
                expect(undefinedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: undefined array — wrong element type", () => {
                const test = {...undefinedVal}
                test.anUndefArray = ([null] as unknown as undefined[])
                expect(undefinedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: test predicate fails", () => {
                const test = {...undefinedVal}
                test.aTest = ('oops' as unknown as undefined)
                expect(undefinedTestType.validate(test)).toBe(false);
            })
        })

        describe("null", () => {
            const nullTestType = schema(t => ({
                aNull: t.null,
                nullable: t.null.nullable,
                aNullArray: t.null.array,
                aTest: t.null.test((v) => v === null),
            }))

            type nullTest = typeof nullTestType.infer

            const nullVal: nullTest = {
                aNull: null,
                nullable: null,
                aNullArray: [null, null],
                aTest: null,
            }

            it("validates", () => {
                expect(nullTestType.validate(nullVal)).toBe(true);
            })

            it("Nullable validates when key is absent", () => {
                expect(nullTestType.validate({
                    aNull: null,
                    aNullArray: [null],
                    aTest: null,
                })).toBe(true);
            })

            it("Doesn't Validate: t.null — undefined instead of null", () => {
                const test = {...nullVal}
                test.aNull = (undefined as unknown as null)
                expect(nullTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.null — non-null value", () => {
                const test = {...nullVal}
                test.aNull = ('hello' as unknown as null)
                expect(nullTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: null array — not an array", () => {
                const test = {...nullVal}
                test.aNullArray = (null as unknown as null[])
                expect(nullTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: null array — wrong element type", () => {
                const test = {...nullVal}
                test.aNullArray = ([undefined] as unknown as null[])
                expect(nullTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: test predicate fails", () => {
                const test = {...nullVal}
                test.aTest = ('oops' as unknown as null)
                expect(nullTestType.validate(test)).toBe(false);
            })
        })

        describe("chained constraints", () => {
            it("t.str: minLen + maxLen", () => {
                const t = schema(s => ({ v: s.str.minLen(3).maxLen(6) }))
                expect(t.validate({ v: 'abc' })).toBe(true);
                expect(t.validate({ v: 'abcdef' })).toBe(true);
                expect(t.validate({ v: 'ab' })).toBe(false);
                expect(t.validate({ v: 'abcdefg' })).toBe(false);
            })

            it("t.str: beginsWith + endsWith", () => {
                const t = schema(s => ({ v: s.str.beginsWith('Hello').endsWith('World') }))
                expect(t.validate({ v: 'Hello World' })).toBe(true);
                expect(t.validate({ v: 'Hello there' })).toBe(false);
                expect(t.validate({ v: 'Hi World' })).toBe(false);
            })

            it("t.num: gt + lt", () => {
                const t = schema(s => ({ v: s.num.gt(0).lt(100) }))
                expect(t.validate({ v: 50 })).toBe(true);
                expect(t.validate({ v: 0 })).toBe(false);
                expect(t.validate({ v: 100 })).toBe(false);
            })

            it("t.bigInt: gt + lt", () => {
                const t = schema(s => ({ v: s.bigInt.gt(0n).lt(100n) }))
                expect(t.validate({ v: 50n })).toBe(true);
                expect(t.validate({ v: 0n })).toBe(false);
                expect(t.validate({ v: 100n })).toBe(false);
            })

            it("t.date: gt + lt", () => {
                const epoch  = new Date(0)
                const mid    = new Date('2024-01-01')
                const future = new Date('2099-01-01')
                const t = schema(s => ({ v: s.date.gt(epoch).lt(future) }))
                expect(t.validate({ v: mid })).toBe(true);
                expect(t.validate({ v: epoch })).toBe(false);
                expect(t.validate({ v: future })).toBe(false);
            })
        })
    })
    describe("complex types", () => {
        const validAddress = { number: '1', street: 'Main', city: 'Springfield', zipCode: '12345' }
        const validCustomer = { id: 1, companyName: 'Acme', email: null, address: validAddress }
        const validLineItem = { description: 'Widget', quantity: 2, unitPrice: 9.99 }

        describe("ref", () => {
            const refTestType = schema(t => ({
                address: t.ref(() => Address),
                customer: t.ref(() => Customer),
            }))

            type refTest = typeof refTestType.infer

            const refVal: refTest = {
                address: validAddress,
                customer: validCustomer,
            }

            it("validates", () => {
                expect(refTestType.validate(refVal)).toBe(true);
            })

            it("Doesn't Validate: ref field is wrong type", () => {
                const test = {...refVal}
                test.address = ('not an object' as unknown as typeof validAddress)
                expect(refTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: ref field is null", () => {
                const test = {...refVal}
                test.address = (null as unknown as typeof validAddress)
                expect(refTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: ref field missing required inner key", () => {
                const test = {...refVal, address: { number: '1', street: 'Main', city: 'Springfield' } as any}
                expect(refTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: ref field has extra inner key", () => {
                const test = {...refVal, address: { ...validAddress, extra: true } as any}
                expect(refTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: ref field inner constraint violated", () => {
                const test = {...refVal, address: { ...validAddress, zipCode: '123' } as any}
                expect(refTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nested ref field wrong type", () => {
                const test = {...refVal, customer: { ...validCustomer, id: 'not-a-number' } as any}
                expect(refTestType.validate(test)).toBe(false);
            })
        })

        describe("ref.array", () => {
            const refArrayTestType = schema(t => ({
                items: t.ref(() => LineItem).array,
            }))

            type refArrayTest = typeof refArrayTestType.infer

            const refArrayVal: refArrayTest = {
                items: [validLineItem, { description: 'Gadget', quantity: 1, unitPrice: 4.99 }],
            }

            it("validates", () => {
                expect(refArrayTestType.validate(refArrayVal)).toBe(true);
            })

            it("validates an empty array", () => {
                expect(refArrayTestType.validate({ items: [] })).toBe(true);
            })

            it("Doesn't Validate: not an array", () => {
                const test = { items: validLineItem } as any
                expect(refArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: array item has wrong field type", () => {
                const test = { items: [{ description: 123, quantity: 1, unitPrice: 5 }] } as any
                expect(refArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: array item missing required key", () => {
                const test = { items: [{ description: 'Widget', quantity: 1 }] } as any
                expect(refArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: array item has extra key", () => {
                const test = { items: [{ ...validLineItem, extra: true }] } as any
                expect(refArrayTestType.validate(test)).toBe(false);
            })
        })

        describe("primitive array", () => {
            const primArrayTestType = schema(t => ({
                tags: t.str.array,
                codes: t.str.array.len(5),
                scores: t.num.array.gte(0),
            }))

            const primArrayVal = {
                tags: ['foo', 'bar'],
                codes: ['ABCDE', '12345'],
                scores: [0, 50, 100],
            }

            it("validates", () => {
                expect(primArrayTestType.validate(primArrayVal)).toBe(true);
            })

            it("validates empty arrays", () => {
                expect(primArrayTestType.validate({ tags: [], codes: [], scores: [] })).toBe(true);
            })

            it("Doesn't Validate: t.str.array — not an array", () => {
                const test = {...primArrayVal, tags: 'not-an-array'} as any
                expect(primArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.array — wrong element type", () => {
                const test = {...primArrayVal, tags: [1, 2, 3]} as any
                expect(primArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.array.len — element too short", () => {
                const test = {...primArrayVal, codes: ['ABCD']} as any
                expect(primArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.str.array.len — element too long", () => {
                const test = {...primArrayVal, codes: ['ABCDEF']} as any
                expect(primArrayTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: t.num.array.gte — element below bound", () => {
                const test = {...primArrayVal, scores: [0, -1, 100]} as any
                expect(primArrayTestType.validate(test)).toBe(false);
            })
        })

        describe("nullable", () => {
            const nullableTestType = schema(t => ({
                email: t.str.nullable,
                count: t.num.nullable,
                address: t.ref(() => Address).nullable,
            }))

            type nullableTest = typeof nullableTestType.infer

            const nullableVal: nullableTest = {
                email: 'test@example.com',
                count: 42,
                address: validAddress,
            }

            it("validates with all fields present", () => {
                expect(nullableTestType.validate(nullableVal)).toBe(true);
            })

            it("validates with all nullable fields null", () => {
                expect(nullableTestType.validate({ email: null, count: null, address: null })).toBe(true);
            })

            it("validates with all nullable fields absent", () => {
                expect(nullableTestType.validate({})).toBe(true);
            })

            it("Doesn't Validate: nullable str — wrong type (not string or null)", () => {
                const test = {...nullableVal, email: 123} as any
                expect(nullableTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nullable num — wrong type (not number or null)", () => {
                const test = {...nullableVal, count: 'oops'} as any
                expect(nullableTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nullable ref — inner constraint violated", () => {
                const test = {...nullableVal, address: { ...validAddress, zipCode: '123' }} as any
                expect(nullableTestType.validate(test)).toBe(false);
            })
        })

        describe("inline nested objects", () => {
            const nestedTestType = schema(t => ({
                name: t.str,
                location: {
                    city: t.str,
                    zip: t.str.len(5),
                },
            }))

            type nestedTest = typeof nestedTestType.infer

            const nestedVal: nestedTest = {
                name: 'HQ',
                location: { city: 'Springfield', zip: '12345' },
            }

            it("validates", () => {
                expect(nestedTestType.validate(nestedVal)).toBe(true);
            })

            it("Doesn't Validate: nested object is missing", () => {
                expect(nestedTestType.validate({ name: 'HQ' })).toBe(false);
            })

            it("Doesn't Validate: nested field wrong type", () => {
                const test = { name: 'HQ', location: { city: 123, zip: '12345' } } as any
                expect(nestedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nested field constraint violated", () => {
                const test = { name: 'HQ', location: { city: 'Springfield', zip: '123' } } as any
                expect(nestedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nested object has extra key", () => {
                const test = { name: 'HQ', location: { city: 'Springfield', zip: '12345', extra: true } } as any
                expect(nestedTestType.validate(test)).toBe(false);
            })

            it("Doesn't Validate: nested object missing required key", () => {
                const test = { name: 'HQ', location: { city: 'Springfield' } } as any
                expect(nestedTestType.validate(test)).toBe(false);
            })
        })

        describe("TypeDefinition.array", () => {
            const pointSchema = schema(t => ({ x: t.num, y: t.num }))
            const pointArraySchema = pointSchema.array

            it("validates an array of objects", () => {
                expect(pointArraySchema.validate([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe(true);
            })

            it("validates an empty array", () => {
                expect(pointArraySchema.validate([])).toBe(true);
            })

            it("Doesn't Validate: not an array", () => {
                expect(pointArraySchema.validate({ x: 1, y: 2 })).toBe(false);
            })

            it("Doesn't Validate: element fails schema", () => {
                expect(pointArraySchema.validate([{ x: 1, y: 'bad' }])).toBe(false);
            })

            it("Doesn't Validate: element has extra key", () => {
                expect(pointArraySchema.validate([{ x: 1, y: 2, z: 3 }])).toBe(false);
            })

            it("Doesn't Validate: element missing required key", () => {
                expect(pointArraySchema.validate([{ x: 1 }])).toBe(false);
            })
        })

        describe("ref.nullable.array and ref.array.nullable", () => {
            const addr = { number: '1', street: 'Main', city: 'Springfield', zipCode: '12345' }

            const refNullableArrayType = schema(t => ({
                items: t.ref(() => Address).nullable.array,
            }))

            const refArrayNullableType = schema(t => ({
                items: t.ref(() => Address).array.nullable,
            }))

            it("ref.nullable.array validates an array of Address objects", () => {
                expect(refNullableArrayType.validate({ items: [addr] })).toBe(true);
                expect(refNullableArrayType.validate({ items: [] })).toBe(true);
            })

            it("ref.nullable.array — array itself is nullable", () => {
                expect(refNullableArrayType.validate({ items: null })).toBe(true);
                expect(refNullableArrayType.validate({})).toBe(true);
            })

            it("ref.nullable.array Doesn't Validate: element fails schema", () => {
                expect(refNullableArrayType.validate({ items: [{ ...addr, zipCode: '123' }] })).toBe(false);
            })

            it("ref.nullable.array Doesn't Validate: not an array or null", () => {
                expect(refNullableArrayType.validate({ items: addr as any })).toBe(false);
            })

            it("ref.array.nullable validates an array of Address objects", () => {
                expect(refArrayNullableType.validate({ items: [addr] })).toBe(true);
                expect(refArrayNullableType.validate({ items: [] })).toBe(true);
            })

            it("ref.array.nullable — array itself is nullable", () => {
                expect(refArrayNullableType.validate({ items: null })).toBe(true);
                expect(refArrayNullableType.validate({})).toBe(true);
            })

            it("ref.array.nullable Doesn't Validate: element fails schema", () => {
                expect(refArrayNullableType.validate({ items: [{ ...addr, zipCode: '123' }] })).toBe(false);
            })

            it("ref.array.nullable Doesn't Validate: not an array or null", () => {
                expect(refArrayNullableType.validate({ items: addr as any })).toBe(false);
            })
        })

        describe("root schema validation", () => {
            const rootType = schema(t => ({
                name: t.str,
                age: t.num,
            }))

            it("validates a matching object", () => {
                expect(rootType.validate({ name: 'Alice', age: 30 })).toBe(true);
            })

            it("Doesn't Validate: extra key at root", () => {
                expect(rootType.validate({ name: 'Alice', age: 30, extra: true })).toBe(false);
            })

            it("Doesn't Validate: missing non-nullable key at root", () => {
                expect(rootType.validate({ name: 'Alice' })).toBe(false);
                expect(rootType.validate({})).toBe(false);
            })

            it("Doesn't Validate: root is not an object", () => {
                expect(rootType.validate('not an object')).toBe(false);
                expect(rootType.validate(42)).toBe(false);
            })

            it("Doesn't Validate: root is null", () => {
                expect(rootType.validate(null)).toBe(false);
            })
        })
    })

    describe("aliases", () => {
        it("t.string behaves the same as t.str", () => {
            const t1 = schema(t => ({ v: t.string }))
            expect(t1.validate({ v: 'hello' })).toBe(true);
            expect(t1.validate({ v: 42 })).toBe(false);
        })

        it("t.number behaves the same as t.num", () => {
            const t1 = schema(t => ({ v: t.number }))
            expect(t1.validate({ v: 42 })).toBe(true);
            expect(t1.validate({ v: 'oops' })).toBe(false);
        })

        it("t.bigint behaves the same as t.bigInt", () => {
            const t1 = schema(t => ({ v: t.bigint }))
            expect(t1.validate({ v: 42n })).toBe(true);
            expect(t1.validate({ v: 42 })).toBe(false);
        })

        it("t.symbol behaves the same as t.sym", () => {
            const t1 = schema(t => ({ v: t.symbol }))
            const s = Symbol('test')
            expect(t1.validate({ v: s })).toBe(true);
            expect(t1.validate({ v: 'not-a-symbol' })).toBe(false);
        })
    })
})