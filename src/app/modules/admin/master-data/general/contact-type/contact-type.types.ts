export interface ContactType {
    id: string;
    name: string;       // Name of the payment avenue
    modifiedDate: string; // Last modification date in ISO format
}

export interface ContactTypePagination {
    length: number;      // Total number of items
    size: number;        // Number of items per page
    page: number;        // Current page number
    lastPage: number;    // Last page number
    startIndex: number;  // Index of the first item on the current page
    endIndex: number;    // Index of the last item on the current page
}