import { DateTime } from "luxon";
export interface Card {
    id: string;
    cardNumber: string;
    cardTypeID: string;
    modifiedDate: string;
}
export interface CardPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}