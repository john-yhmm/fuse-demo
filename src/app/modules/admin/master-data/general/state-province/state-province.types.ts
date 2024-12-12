import { DateTime } from "luxon";

export interface StateProvince {
    id: string;
    stateProvinceCode: string;
    stateProvinceName: string;
    countryId: string;
    salesTerritoryId: string;
    border: string;
    latestRecordedPopulation: number;
    rowguid: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}

export interface StateProvincePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}