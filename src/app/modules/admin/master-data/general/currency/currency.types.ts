import { DateTime } from "luxon";
export interface Currency {
    id: string;
    currencyName: string;
    lastEditedBy: string;
    lastEditedOn: string;
}
export interface CurrencyPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
