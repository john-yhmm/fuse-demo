import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PhnoType,
    PhnoTypePagination,
} from 'app/modules/admin/master-data/general/phno-type/phno-type.types';
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
export class PhnoTypeService {
    // Private
    private _pagination: BehaviorSubject<PhnoTypePagination | null> =
        new BehaviorSubject(null);
    private _phnoType: BehaviorSubject<PhnoType | null> = new BehaviorSubject(
        null
    );
    private _phnoTypes: BehaviorSubject<PhnoType[] | null> =
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
    get pagination$(): Observable<PhnoTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for phone number type
     */
    get phnoType$(): Observable<PhnoType> {
        return this._phnoType.asObservable();
    }

    /**
     * Getter for phone number types
     */
    get phnoTypes$(): Observable<PhnoType[]> {
        return this._phnoTypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get phnumtypes
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getPhnoTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: PhnoTypePagination;
        phnoTypes: PhnoType[];
    }> {
        return this._httpClient
            .get<{
                pagination: PhnoTypePagination;
                phnoTypes: PhnoType[];
            }>('api/master-data/general/phno-types', {
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
                    this._phnoTypes.next(response.phnoTypes);
                })
            );
    }

    /**
     * Get phone number type by id
     */
    getPhnoTypeById(id: string): Observable<PhnoType> {
        return this._phnoTypes.pipe(
            take(1),
            map((phnoTypes) => {
                // Find the phone number type
                const phnoType =
                    phnoTypes.find((item) => item.id === id) || null;

                // Update the selected phone number type
                this._phnoType.next(phnoType);

                // Return the phone number type
                return phnoType;
            }),
            switchMap((phnoType) => {
                if (!phnoType) {
                    return throwError(
                        'Could not find phone number type with id of ' + id + '!'
                    );
                }

                return of(phnoType);
            })
        );
    }

    /**
     * Create phone number type
     */
    createPhnoType(): Observable<PhnoType> {
        return this.phnoTypes$.pipe(
            take(1),
            switchMap((phnoTypes) =>
                this._httpClient
                    .post<PhnoType>('api/master-data/general/phno-type', {})
                    .pipe(
                        map((newPhnoType) => {
                            // Update the phone number types with the new type
                            this._phnoTypes.next([newPhnoType, ...phnoTypes]);

                            // Return the new phone number type
                            return newPhnoType;
                        })
                    )
            )
        );
    }

    /**
     * Update phone number type
     *
     * @param id
     * @param phnoType
     */
    updatePhNoType(id: string, phnoType: PhnoType): Observable<PhnoType> {
        return this.phnoTypes$.pipe(
            take(1),
            switchMap((phnoTypes) =>
                this._httpClient
                    .patch<PhnoType>('api/master-data/general/phno-type', {
                        id,
                        phnoType,
                    })
                    .pipe(
                        map((updatedPhnoType) => {
                            console.log('API Response:', updatedPhnoType)
                            // Find the index of the updated phone number type
                            const index = phnoTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the type
                            phnoTypes[index] = updatedPhnoType;

                            // Update the phone number types
                            this._phnoTypes.next(phnoTypes);

                            // Return the updated type
                            return updatedPhnoType;
                        }),
                        switchMap((updatedPhnoType) =>
                            this.phnoType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the selected type if it's selected
                                    this._phnoType.next(updatedPhnoType);

                                    // Return the updated type
                                    return updatedPhnoType;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the phone number type
     *
     * @param id
     */
    deletePhnoType(id: string): Observable<boolean> {
        return this.phnoTypes$.pipe(
            take(1),
            switchMap((phnoTypes) =>
                this._httpClient
                    .delete('api/master-data/general/phno-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                           
                            // Find the index of the deleted type
                            const index = phnoTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the type
                            phnoTypes.splice(index, 1);

                            // Update the phone number types
                            this._phnoTypes.next(phnoTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
