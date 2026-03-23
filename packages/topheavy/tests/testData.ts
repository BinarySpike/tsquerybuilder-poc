import { schema } from '../src/schema';

export const Customer = schema(t => ({
    id: t.num,
    companyName: t.str.nullable,
    email: t.str.nullable.email,
    address: t.ref(() => Address),
}));

export const Address = schema(t => ({
    number: t.str,
    street: t.str,
    city: t.str,
    zipCode: t.str.len(5),
}));

export const Invoice = schema(t => ({
    invoiceNumber: t.str,
    customer: t.ref(() => Customer),
    items: t.ref(() => LineItem).array,
    dueDate: t.date,
    totalAmount: t.number,
}));

export const Business = schema(t => ({
    name: t.str,
    customers: t.ref(() => Customer).array,
}));

export const LineItem = schema(t => ({
    description: t.str,
    quantity: t.num,
    unitPrice: t.num,
}));