import { th } from "./topheavytypes";

const Business = th(t => ({
    name: t.str,
    customers: t.ref(() => Customer).array
}))

type BusinessType = typeof Business.infer

const validBusiness: BusinessType = {
    name: "Test",
    customers: []
}

const Customer = th(t => ({
    id: t.num,
    companyName: t.str,
    email: t.str.nullable.email,
    address: t.string,
}))

console.log(Business.validate(validBusiness));

type CustomerType = typeof Customer.infer;
const validCustomer: CustomerType = {
    id: 1,
    companyName: "Test",
    email: null,
    address: "Test"
}

console.log(Customer.validate(validCustomer));

const LineItem = th(t => ({
    description: t.str,
    quantity: t.num,
    unitPrice: t.num,
}))

const Invoice = th(t => ({
    id: t.num,
    customer: Customer,
    items: LineItem.array,
    dueDate: t.date,
    totalAmount: t.number,
}));

type InvoiceType = typeof Invoice.infer

const EverythingElse = th(t => ({
    sym: t.sym,
    biggy: t.bigint,
    bool: t.bool,
    undy: t.undefined,
    nully: t.null,
    literally: t.literal(12),
    literate: t.literal("literal", "illiterate"),
    tempted: t.string.template`email: ${t.string}`,
}))

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