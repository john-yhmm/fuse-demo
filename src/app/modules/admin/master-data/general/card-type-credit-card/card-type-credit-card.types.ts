import { DateTime } from "luxon";

export interface CardTypeCreditCard {
    id: string;
    name: string;
    startNumber: number;
    endNumber: number;
    cardTypeID: string;
    modifiedDate: string;
}

export interface CardTypeCreditCardPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}