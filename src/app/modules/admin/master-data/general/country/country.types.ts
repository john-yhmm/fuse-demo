import { DateTime } from "luxon";

export interface Country {
    id: string;
    countryName: string;
    formalName: string;
    isoAlpha3Code: string;
    isoNumericCode: number;
    countryTypeID: number;
    latestRecordedPopulation: number;
    continent: string;
    region: string;
    subregion: string;
    border: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}

export interface CountryPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}