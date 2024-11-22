import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    CountryType, 
    CountryTypePagination, 
} from 'app/modules/admin/master-data/general/country-type/country-type.types';
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
export class CountryTypeService {
    // Private
    private _pagination: BehaviorSubject<CountryTypePagination | null> =
        new BehaviorSubject(null);
    private _countryType: BehaviorSubject<CountryType | null> = new BehaviorSubject(
        null
    );
    private _countryTypes: BehaviorSubject<CountryType[] | null> =
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
    get pagination$(): Observable<CountryTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for countryType
     */
    get countryType$(): Observable<CountryType> {
        return this._countryType.asObservable();
    }

    /**
     * Getter for countryTypes
     */
    get countryTypes$(): Observable<CountryType[]> {
        return this._countryTypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get country types
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCountryTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'countryTypeName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CountryTypePagination;
        countryTypes: CountryType[];
    }> {
        return this._httpClient
            .get<{
                pagination: CountryTypePagination;
                countryTypes: CountryType[];
            }>('api/master-data/general/country-types', {
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
                    this._countryTypes.next(response.countryTypes);
                })
            );
    }

    /**
     * Get country type by id
     */
    getCountryTypeById(id: string): Observable<CountryType> {
        return this._countryTypes.pipe(
            take(1),
            map((countryTypes) => {
                // Find the country type
                const countryType =
                    countryTypes.find((item) => item.id === id) || null;

                // Update the country type
                this._countryType.next(countryType);

                // Return the country type
                return countryType;
            }),
            switchMap((countryType) => {
                if (!countryType) {
                    return throwError(
                        'Could not found country type with id of ' + id + '!'
                    );
                }

                return of(countryType);
            })
        );
    }

    /**
     * Create country type
     */
    createCountryType(): Observable<CountryType> {
        return this.countryTypes$.pipe(
            take(1),
            switchMap((countryTypes) =>
                this._httpClient
                    .post<CountryType>('api/master-data/general/country-type', {})
                    .pipe(
                        map((newCountryType) => {
                            // Update the country types with the new country type
                            this._countryTypes.next([newCountryType, ...countryTypes]);

                            // Return the new country type
                            return newCountryType;
                        })
                    )
            )
        );
    }

    /**
     * Update country type
     *
     * @param id
     * @param countryType
     */
    updateCountryType(id: string, countryType: CountryType): Observable<CountryType> {
        return this.countryTypes$.pipe(
            take(1),
            switchMap((countryTypes) =>
                this._httpClient
                    .patch<CountryType>('api/master-data/general/country-type', {
                        id,
                        countryType,
                    })
                    .pipe(
                        map((updatedCountryType) => {
                            // Find the index of the updated country type
                            const index = countryTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the country type
                            countryTypes[index] = updatedCountryType;

                            // Update the country types
                            this._countryTypes.next(countryTypes);

                            // Return the updated country type
                            return updatedCountryType;
                        }),
                        switchMap((updatedCountryType) =>
                            this.countryType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the country type if it's selected
                                    this._countryType.next(updatedCountryType);

                                    // Return the updated country type
                                    return updatedCountryType;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the country type
     *
     * @param id
     */
    deleteCountryType(id: string): Observable<boolean> {
        return this.countryTypes$.pipe(
            take(1),
            switchMap((countryTypes) =>
                this._httpClient
                    .delete('api/master-data/general/country-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted country type
                            const index = countryTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the country type
                            countryTypes.splice(index, 1);

                            // Update the country types
                            this._countryTypes.next(countryTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
