import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    CountryRegion,
    CountryRegionPagination,
} from 'app/modules/admin/master-data/general/country-region/country-region.types';
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
export class CountryRegionService {
    // Private
    private _pagination: BehaviorSubject<CountryRegionPagination | null> =
        new BehaviorSubject(null);
    private _countryRegion: BehaviorSubject<CountryRegion | null> = new BehaviorSubject(
        null
    );
    private _countryRegions: BehaviorSubject<CountryRegion[] | null> =
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
    get pagination$(): Observable<CountryRegionPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for countryRegion
     */
    get countryRegion$(): Observable<CountryRegion> {
        return this._countryRegion.asObservable();
    }

    /**
     * Getter for countryRegions
     */
    get countryRegions$(): Observable<CountryRegion[]> {
        return this._countryRegions.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get countryRegions
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCountryRegions(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CountryRegionPagination;
        countryRegions: CountryRegion[];
    }> {
        return this._httpClient
            .get<{
                pagination: CountryRegionPagination;
                countryRegions: CountryRegion[];
            }>('api/master-data/general/countryRegions', {
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
                    this._countryRegions.next(response.countryRegions);
                })
            );
    }

    /**
     * Get countryRegion by id
     */
    getCountryRegionById(id: string): Observable<CountryRegion> {
        return this._countryRegions.pipe(
            take(1),
            map((countryRegions) => {
                // Find the countryRegion
                const countryRegion =
                    countryRegions.find((item) => item.id === id) || null;

                // Update the countryRegion
                this._countryRegion.next(countryRegion);

                // Return the countryRegion
                return countryRegion;
            }),
            switchMap((countryRegion) => {
                if (!countryRegion) {
                    return throwError(
                        'Could not found countryRegion with id of ' + id + '!'
                    );
                }

                return of(countryRegion);
            })
        );
    }

    /**
     * Create countryRegion
     */
    createCountryRegion(): Observable<CountryRegion> {
        return this.countryRegions$.pipe(
            take(1),
            switchMap((countryRegions) =>
                this._httpClient
                    .post<CountryRegion>('api/master-data/general/countryRegion', {})
                    .pipe(
                        map((newCountryRegion) => {
                            // Update the countryRegions with the new countryRegion
                            this._countryRegions.next([newCountryRegion, ...countryRegions]);

                            // Return the new countryRegion
                            return newCountryRegion;
                        })
                    )
            )
        );
    }

    /**
     * Update countryRegion
     *
     * @param id
     * @param countryRegion
     */
    updateCountryRegion(id: string, countryRegion: CountryRegion): Observable<CountryRegion> {
        return this.countryRegions$.pipe(
            take(1),
            switchMap((countryRegions) =>
                this._httpClient
                    .patch<CountryRegion>('api/master-data/general/countryRegion', {
                        id,
                        countryRegion,
                    })
                    .pipe(
                        map((updatedCountryRegion) => {
                            // Find the index of the updated countryRegion
                            const index = countryRegions.findIndex(
                                (item) => item.id === id
                            );

                            // Update the countryRegion
                            countryRegions[index] = updatedCountryRegion;

                            // Update the countryRegions
                            this._countryRegions.next(countryRegions);

                            // Return the updated countryRegion
                            return updatedCountryRegion;
                        }),
                        switchMap((updatedCountryRegion) =>
                            this.countryRegion$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the countryRegion if it's selected
                                    this._countryRegion.next(updatedCountryRegion);

                                    // Return the updated countryRegion
                                    return updatedCountryRegion;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the countryRegion
     *
     * @param id
     */
    deleteCountryRegion(id: string): Observable<boolean> {
        return this.countryRegions$.pipe(
            take(1),
            switchMap((countryRegions) =>
                this._httpClient
                    .delete('api/master-data/general/countryRegion', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted countryRegion
                            const index = countryRegions.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the countryRegion
                            countryRegions.splice(index, 1);

                            // Update the countryRegions
                            this._countryRegions.next(countryRegions);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
