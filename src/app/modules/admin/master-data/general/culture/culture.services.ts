import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    Culture,
    CulturePagination,
} from 'app/modules/admin/master-data/general/culture/culture.types';
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
export class CultureService {
    // Private
    private _pagination: BehaviorSubject<CulturePagination | null> =
        new BehaviorSubject(null);
    private _culture: BehaviorSubject<Culture | null> = new BehaviorSubject(
        null
    );
    private _cultures: BehaviorSubject<Culture[] | null> =
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
    get pagination$(): Observable<CulturePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for culture
     */
    get culture$(): Observable<Culture> {
        return this._culture.asObservable();
    }

    /**
     * Getter for cultures
     */
    get cultures$(): Observable<Culture[]> {
        return this._cultures.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get cultures
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCultures(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CulturePagination;
        cultures: Culture[];
    }> {
        return this._httpClient
            .get<{
                pagination: CulturePagination;
                cultures: Culture[];
            }>('api/master-data/general/cultures', {
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
                    this._cultures.next(response.cultures);
                })
            );
    }

    /**
     * Get culture by id
     */
    getCultureById(id: string): Observable<Culture> {
        return this._cultures.pipe(
            take(1),
            map((cultures) => {
                // Find the culture
                const culture =
                    cultures.find((item) => item.id === id) || null;

                // Update the culture
                this._culture.next(culture);

                // Return the culture
                return culture;
            }),
            switchMap((culture) => {
                if (!culture) {
                    return throwError(
                        'Could not found culture with id of ' + id + '!'
                    );
                }

                return of(culture);
            })
        );
    }

    /**
     * Create culture
     */
    createCulture(): Observable<Culture> {
        return this.cultures$.pipe(
            take(1),
            switchMap((cultures) =>
                this._httpClient
                    .post<Culture>('api/master-data/general/culture', {})
                    .pipe(
                        map((newCulture) => {
                            // Update the cultures with the new culture
                            this._cultures.next([newCulture, ...cultures]);

                            // Return the new culture
                            return newCulture;
                        })
                    )
            )
        );
    }

    /**
     * Update culture
     *
     * @param id
     * @param culture
     */
    updateCulture(id: string, culture: Culture): Observable<Culture> {
        return this.cultures$.pipe(
            take(1),
            switchMap((cultures) =>
                this._httpClient
                    .patch<Culture>('api/master-data/general/culture', {
                        id,
                        culture,
                    })
                    .pipe(
                        map((updatedCulture) => {
                            // Find the index of the updated culture
                            const index = cultures.findIndex(
                                (item) => item.id === id
                            );

                            // Update the culture
                            cultures[index] = updatedCulture;

                            // Update the cultures
                            this._cultures.next(cultures);

                            // Return the updated culture
                            return updatedCulture;
                        }),
                        switchMap((updatedCulture) =>
                            this.culture$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the culture if it's selected
                                    this._culture.next(updatedCulture);

                                    // Return the updated culture
                                    return updatedCulture;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the culture
     *
     * @param id
     */
    deleteCulture(id: string): Observable<boolean> {
        return this.cultures$.pipe(
            take(1),
            switchMap((cultures) =>
                this._httpClient
                    .delete('api/master-data/general/culture', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted culture
                            const index = cultures.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the culture
                            cultures.splice(index, 1);

                            // Update the cultures
                            this._cultures.next(cultures);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
