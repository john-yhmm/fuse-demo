import { DateTime } from "luxon";

export interface CardType {
    id: string;
    name: string;
    issuerId: string;
    modifiedDate: string;
}

export interface CardTypePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
