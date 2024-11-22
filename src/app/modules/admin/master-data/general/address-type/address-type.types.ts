export interface AddressType {
    id: string;
    addressTypeName: string;
    rowguid: string;
    lasteditedBy: string;
    lasteditedOn: string;
}

export interface AddressTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
