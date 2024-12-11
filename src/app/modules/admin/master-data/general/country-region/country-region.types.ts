export interface CountryRegion {
    id: string;
    languageCode: string;
    name: string;
    modifiedDate: string;
}

export interface CountryRegionPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
