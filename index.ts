import type { Invoice } from './dataTypes';
import { query } from './queryBuilder';

function assertDeepEqual(actual: unknown, expected: unknown, msg: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}\nActual:   ${a}\nExpected: ${e}`);
}

let invoices = query<Invoice>();

let results = invoices
  .where("invoiceNumber").contains("5").or.contains("7")
  .andWhere(i => i.where("billingAddress.street.name").is("Luna").or.is("Moon")
    .andWhere("billingAddress.street.type.ordinalNumber").in([1, 2, 3]))

let expectedCondition = [
  [["invoiceNumber", "contains", "5"], "or", ["invoiceNumber", "contains", "7"]],
  "and",
  [["billingAddress.street.name", "is", "Luna"], "or", ["billingAddress.street.name", "is", "Moon"]],
  "and",
  [["billingAddress.street.type.ordinalNumber", "in", [1, 2, 3]]]
];

console.log("Built conditions:", JSON.stringify(results.getConditions(), null, 2));
assertDeepEqual(results.getConditions(), expectedCondition, "Conditions should match expected format");
console.log("✓ Conditions match expected format!\n");

// Select specific fields
let fieldSelect = query<Invoice>()
  .where("invoiceNumber").is("1234")
  .select("invoiceNumber", "billingAddress.street");
console.log("Field select:", JSON.stringify(fieldSelect, null, 2));

// Select with aggregate only
let aggSelect = query<Invoice>()
  .where("invoiceNumber").is("1234")
  .select(s => s.countDistinct("billingAddress.city"));
console.log("Aggregate select:", JSON.stringify(aggSelect, null, 2));

// Select fields + aggregate
let combinedSelect = query<Invoice>()
  .where("invoiceNumber").is("1234")
  .select("invoiceNumber", "billingAddress.street", s => s.countDistinct("billingAddress.city"));
console.log("Combined select:", JSON.stringify(combinedSelect, null, 2));

// selectAll
let allSelect = query<Invoice>()
  .where("billingAddress.street.type.ordinalNumber").is(1)
  .selectAll();
console.log("SelectAll:", JSON.stringify(allSelect, null, 2));

// orderBy + select
let orderedSelect = query<Invoice>()
  .where("invoiceNumber").is("1234")
  .orderBy("invoiceNumber", "desc")
  .orderBy("billingAddress.city")
  .select("invoiceNumber");
console.log("Ordered select:", JSON.stringify(orderedSelect, null, 2));
