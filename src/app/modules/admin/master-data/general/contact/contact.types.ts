import { DateTime } from "luxon";

export interface Contact {
    id: string;
    contactTypeId: string;
    phoneNumber: string;
    phoneNumberTypeId: string;
    faxNumber: string;
    emailAddress: string;
    websiteUrl: string;
    customFields: string;
    lastEditedBy: string;
    lastEditedOn: string;
}

export interface ContactPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}