import { DateTime } from "luxon";

export interface PhoneNumberType {
    id: string;
    name: string;
    modifiedDate: string;
}

export interface PhoneNumberTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
