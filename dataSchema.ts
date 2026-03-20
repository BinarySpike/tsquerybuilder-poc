interface ThType {
    str(): ThTypeChain<string>;
    num(): ThTypeChain<number>;
    bool(): ThTypeChain<boolean>;
    array<T = any>(): ThTypeChain<T[]>;
    ref<T>(t: TypeDefinition): ThTypeChain<T>;
}

interface TypeDefinition {

}

function th(cb: (s: ThType) => void): TypeDefinition {
    return {} as TypeDefinition
}

interface ThTypeChain<T> {

}

const StreetType = th(t => {
    typeName: t.str();
    ordinalNumber: t.num();
})

const Street = th(t => {
    name: t.str();
    type: t.ref(StreetType)
})

const Address = th(t => {
    street: t.ref(Street);
    city: t.str();
    zipCode: t.str()
})

const Invoice = th(t => {
    invoiceNumber: t.str();
    billingAddress: t.ref(Address);
})