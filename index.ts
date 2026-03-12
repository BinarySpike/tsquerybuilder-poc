import type { Invoice } from './dataTypes';
import { IThQueryBuilderEntry } from './topheavy';

let invoices = {} as IThQueryBuilderEntry<Invoice>;

let results = invoices
  .where("invoiceNumber").contains("5").or.contains("7")
  .andWhere(i => i.where("billingAddress.street.name").is("Luna").or.is("Moon")
               .andWhere("billingAddress.street.type.ordinalNumber").in([1, 2, 3]))

invoices.where(i => i.where("invoiceNumber").contains("5"))