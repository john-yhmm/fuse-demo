import { DateTime } from "luxon";

export interface PhnoType {
    id: string;
    name: string;
    modifiedDate: string;
}

export interface PhnoTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
