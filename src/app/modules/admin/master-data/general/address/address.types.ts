import { DateTime } from "luxon";

export interface Address {
    id: string;
    addressTypeId: string;
    addressLine1: string;
    addressLine2: string;
    cityId: string;
    stateProvinceId: string;
    rowguid: string;
    lastEditedBy: string;
    lastEditedOn: string;
}

export interface AddressPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}