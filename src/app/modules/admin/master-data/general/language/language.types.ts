export interface Language {
    id: string;
    languageCode: string;
    name: string;
    modifiedDate: string;
}

export interface LanguagePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
