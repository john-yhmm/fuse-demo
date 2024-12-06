export interface TransactionType {
    id: string;
    transactionTypeName: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}

export interface TransactionTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}