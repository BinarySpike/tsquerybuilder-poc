import type { Invoice } from './dataTypes';
import { Query } from './topheavy';

let invoices = {} as Query<Invoice>;

let results = invoices
  .where("invoiceNumber").contains("5").or.contains("7")
  .andWhere(i => i.where("billingAddress.street.name").is("Luna").or.is("Moon")
    .andWhere("billingAddress.street.type.ordinalNumber").in([1, 2, 3]))

invoices.where(i => i.where("invoiceNumber").contains("5"));

invoices.where("billingAddress.street.type.ordinalNumber").is(1).selectAll();

invoices.where("invoiceNumber").is("1234").orderBy("invoiceNumber", "desc").orderBy("billingAddress.city");

// Select specific fields
invoices.where("invoiceNumber").is("1234").select("invoiceNumber", "billingAddress.street");

// Select with aggregate only
invoices.where("invoiceNumber").is("1234").select(s => s.countDistinct("billingAddress.city"));

// Select fields + aggregate
invoices.where("invoiceNumber").is("1234")
  .select("invoiceNumber", "billingAddress.street", s => s.countDistinct("billingAddress.city"));