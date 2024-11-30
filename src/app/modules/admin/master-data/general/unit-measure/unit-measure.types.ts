export interface UnitMeasure {
    id: string;
    unitMeasureCode: string;
    unitMeasureName: string;
    lastModifiedBy: string;
    lastModifiedOn: string;
}

export interface UnitMeasurePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
