export interface Culture {
    id: string;
    cultureCode: string;
    name: string;
    status: boolean;
    modifiedDate: string;
}

export interface CulturePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
