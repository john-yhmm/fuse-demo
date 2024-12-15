export interface GeoLocation {
    id: string;
    geoLocationValue: string;
    description: string;
    lastEditedBy: string;
    lastEditedOn: string;
}

export interface GeoLocationPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
