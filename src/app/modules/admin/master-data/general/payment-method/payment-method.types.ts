export interface PaymentMethod {
    id: string;
    paymentMethodName: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}

export interface PaymentMethodPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
