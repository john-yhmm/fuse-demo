export interface CardType {
    id: string;
    cardTypeName: string;
    issuerID: string;
    lasteditedBy: string;
    lasteditedOn: string;
}

export interface CardTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
