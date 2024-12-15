import { DateTime } from "luxon";
export interface CurrencyRate {
    id: '1',
    currencyRateDate: 'string';
    fromCurrencyID: 'string';
    toCurrencyID: 'string';
    averageRate: 'number';
    endOfDatRate: 'number';
    modifiedDate: 'number';
}
export interface CurrencyRatePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}