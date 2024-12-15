import { DateTime } from "luxon";

export interface City {
    id: string;
    cityName: string;
    stateProvinceId: string;
    latestRecordedPopulation: number;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}

export interface CityPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}