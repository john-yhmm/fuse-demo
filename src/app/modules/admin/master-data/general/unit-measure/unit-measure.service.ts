import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    UnitMeasure,
    UnitMeasurePagination,
} from 'app/modules/admin/master-data/general/unit-measure/unit-measure.types';
import {
    BehaviorSubject,
    Observable,
    filter,
    map,
    of,
    switchMap,
    take,
    tap,
    throwError,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnitMeasureService {
    // Private
    private _pagination: BehaviorSubject<UnitMeasurePagination | null> =
        new BehaviorSubject(null);
    private _unitMeasure: BehaviorSubject<UnitMeasure | null> = new BehaviorSubject(
        null
    );
    private _unitMeasures: BehaviorSubject<UnitMeasure[] | null> =
        new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<UnitMeasurePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for language
     */
    get unitMeasure$(): Observable<UnitMeasure> {
        return this._unitMeasure.asObservable();
    }

    /**
     * Getter for languages
     */
    get unitMeasures$(): Observable<UnitMeasure[]> {
        return this._unitMeasures.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get languages
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getUnitMeasures(
        page: number = 0,
        size: number = 10,
        sort: string = 'unitMeasureName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: UnitMeasurePagination;
        unitMeasures: UnitMeasure[];
    }> {
        return this._httpClient
            .get<{
                pagination: UnitMeasurePagination;
                unitMeasures: UnitMeasure[];
            }>('api/master-data/general/unit-measures', {
                params: {
                    page: '' + page,
                    size: '' + size,
                    sort,
                    order,
                    search,
                },
            })
            .pipe(
                tap((response) => {
                    this._pagination.next(response.pagination);
                    this._unitMeasures.next(response.unitMeasures);
                })
            );
    }

    /**
     * Get language by id
     */
    getUnitMeasureById(id: string): Observable<UnitMeasure> {
        return this._unitMeasures.pipe(
            take(1),
            map((unitMeasures) => {
                // Find the language
                const unitMeasure =
                    unitMeasures.find((item) => item.id === id) || null;

                // Update the language
                this._unitMeasure.next(unitMeasure);

                // Return the language
                return unitMeasure;
            }),
            switchMap((unitMeasure) => {
                if (!unitMeasure) {
                    return throwError(
                        'Could not found unit measure with id of ' + id + '!'
                    );
                }

                return of(unitMeasure);
            })
        );
    }

    /**
     * Create language
     */
    createUnitMeasure(): Observable<UnitMeasure> {
        return this.unitMeasures$.pipe(
            take(1),
            switchMap((unitMeasures) =>
                this._httpClient
                    .post<UnitMeasure>('api/master-data/general/unit-measure', {})
                    .pipe(
                        map((newUnitMeasure) => {
                            // Update the languages with the new language
                            this._unitMeasures.next([newUnitMeasure, ...unitMeasures]);

                            // Return the new language
                            return newUnitMeasure;
                        })
                    )
            )
        );
    }

    /**
     * Update language
     *
     * @param id
     * @param unitMeasure
     */
    updateUnitMeasure(id: string, unitMeasure : UnitMeasure): Observable<UnitMeasure> {
        return this.unitMeasures$.pipe(
            take(1),
            switchMap((unitMeasures) =>
                this._httpClient
                    .patch<UnitMeasure>('api/master-data/general/unit-measure', {
                        id,
                        unitMeasure,
                    })
                    .pipe(
                        map((updatedUnitMeasure) => {
                            // Find the index of the updated language
                            const index = unitMeasures.findIndex(
                                (item) => item.id === id
                            );

                            // Update the language
                            unitMeasures[index] = updatedUnitMeasure;

                            // Update the languages
                            this._unitMeasures.next(unitMeasures);

                            // Return the updated language
                            return updatedUnitMeasure;
                        }),
                        switchMap((updatedUnitMeasure) =>
                            this.unitMeasure$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the language if it's selected
                                    this._unitMeasure.next(updatedUnitMeasure);

                                    // Return the updated language
                                    return updatedUnitMeasure;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the language
     *
     * @param id
     */
    deleteUnitMeasure(id: string): Observable<boolean> {
        return this.unitMeasures$.pipe(
            take(1),
            switchMap((unitMeasures) =>
                this._httpClient
                    .delete('api/master-data/general/unit-measure', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted language
                            const index = unitMeasures.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the language
                            unitMeasures.splice(index, 1);

                            // Update the languages
                            this._unitMeasures.next(unitMeasures);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
