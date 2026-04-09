"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineItem = exports.Business = exports.Invoice = exports.Address = exports.Customer = void 0;
var schema_1 = require("../src/schema");
exports.Customer = (0, schema_1.schema)(function (t) { return ({
    id: t.num,
    companyName: t.str.nullable,
    email: t.str.nullable.email,
    // @ts-ignore
    address: exports.Address,
}); });
exports.Address = (0, schema_1.schema)(function (t) { return ({
    number: t.str,
    street: t.str,
    city: t.str,
    zipCode: t.str.len(5),
}); });
exports.Invoice = (0, schema_1.schema)(function (t) { return ({
    invoiceNumber: t.str,
    customer: t.ref(function () { return exports.Customer; }),
    items: t.ref(function () { return exports.LineItem; }).array,
    dueDate: t.date,
    totalAmount: t.number,
}); });
exports.Business = (0, schema_1.schema)(function (t) { return ({
    name: t.str,
    customers: t.ref(function () { return exports.Customer; }).array,
}); });
exports.LineItem = (0, schema_1.schema)(function (t) { return ({
    description: t.str,
    quantity: t.num,
    unitPrice: t.num,
}); });
