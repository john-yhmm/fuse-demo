import { DateTime } from "luxon";

export interface CountryType {
    id: string;
    countryTypeName: string;
    lastEditedBy: string;
    lastEditedOn: string;
}

export interface CountryTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}