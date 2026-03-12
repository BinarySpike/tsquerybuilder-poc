export interface Invoice {
  invoiceNumber: string;
  billingAddress: Address;
}

export interface Address {
  street: Street;
  city: string;
  zipCode: string;
}

export interface Street {
  name: string;
  type: StreetType;
}

export interface StreetType {
  typeName: string;
  ordinalNumber: number;
}