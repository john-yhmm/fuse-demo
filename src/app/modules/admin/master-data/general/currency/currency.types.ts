import { DateTime } from "luxon";
export interface Currency {
    id: string;
    currencyCode: string;
    currencyName: string;
    symbol: string;
    modifiedDate: string;
}
export interface CurrencyPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}





