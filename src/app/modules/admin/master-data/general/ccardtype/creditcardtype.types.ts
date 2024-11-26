export interface CreditCardType {
    id: string;
    name: string;
    modifiedDate: string;
}

export interface CreditCardTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
