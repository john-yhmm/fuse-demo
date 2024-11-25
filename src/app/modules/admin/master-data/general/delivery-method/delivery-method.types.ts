import { DateTime } from "luxon";

export interface DeliveryMethod {
    id: string;
    deliveryMethodName: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}
export interface DeliveryMethodPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}