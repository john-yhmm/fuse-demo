import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PhoneNumberType,
    PhoneNumberTypePagination,
} from 'app/modules/admin/master-data/general/phone-number-type/phone-number-type.types';
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
export class PhoneNumberTypeService {
    // Private
    private _pagination: BehaviorSubject<PhoneNumberTypePagination | null> =
        new BehaviorSubject(null);
    private _phoneNumberType: BehaviorSubject<PhoneNumberType | null> = new BehaviorSubject(
        null
    );
    private _phoneNumberTypes: BehaviorSubject<PhoneNumberType[] | null> =
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
    get pagination$(): Observable<PhoneNumberTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for phone number type
     */
    get phoneNumberType$(): Observable<PhoneNumberType> {
        return this._phoneNumberType.asObservable();
    }

    /**
     * Getter for phone number types
     */
    get phoneNumberTypes$(): Observable<PhoneNumberType[]> {
        return this._phoneNumberTypes.asObservable();
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
    getPhoneNumberTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: PhoneNumberTypePagination;
        phoneNumberTypes: PhoneNumberType[];
    }> {
        return this._httpClient
            .get<{
                pagination: PhoneNumberTypePagination;
                phoneNumberTypes: PhoneNumberType[];
            }>('api/master-data/general/phone-number-types', {
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
                    this._phoneNumberTypes.next(response.phoneNumberTypes);
                })
            );
    }

    /**
     * Get phone number type by id
     */
    getPhoneNumberTypeById(id: string): Observable<PhoneNumberType> {
        return this._phoneNumberTypes.pipe(
            take(1),
            map((phoneNumberTypes) => {
                // Find the phone number type
                const phoneNumberType =
                    phoneNumberTypes.find((item) => item.id === id) || null;

                // Update the selected phone number type
                this._phoneNumberType.next(phoneNumberType);

                // Return the phone number type
                return phoneNumberType;
            }),
            switchMap((phoneNumberType) => {
                if (!phoneNumberType) {
                    return throwError(
                        'Could not find phone number type with id of ' + id + '!'
                    );
                }

                return of(phoneNumberType);
            })
        );
    }

    /**
     * Create phone number type
     */
    createPhoneNumberType(): Observable<PhoneNumberType> {
        return this.phoneNumberTypes$.pipe(
            take(1),
            switchMap((phoneNumberTypes) =>
                this._httpClient
                    .post<PhoneNumberType>('api/master-data/general/phone-number-type', {})
                    .pipe(
                        map((newPhoneNumberType) => {
                            // Update the phone number types with the new type
                            this._phoneNumberTypes.next([newPhoneNumberType, ...phoneNumberTypes]);

                            // Return the new phone number type
                            return newPhoneNumberType;
                        })
                    )
            )
        );
    }

    /**
     * Update phone number type
     *
     * @param id
     * @param phoneNumberType
     */
    updatePhoneNumberType(id: string, phoneNumberType: PhoneNumberType): Observable<PhoneNumberType> {
        return this.phoneNumberTypes$.pipe(
            take(1),
            switchMap((phoneNumberTypes) =>
                this._httpClient
                    .patch<PhoneNumberType>('api/master-data/general/phone-number-type', {
                        id,
                        phoneNumberType,
                    })
                    .pipe(
                        map((updatedPhoneNumberType) => {
                            console.log('API Response:', updatedPhoneNumberType)
                            // Find the index of the updated phone number type
                            const index = phoneNumberTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the type
                            phoneNumberTypes[index] = updatedPhoneNumberType;

                            // Update the phone number types
                            this._phoneNumberTypes.next(phoneNumberTypes);

                            // Return the updated type
                            return updatedPhoneNumberType;
                        }),
                        switchMap((updatedPhoneNumberType) =>
                            this.phoneNumberType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the selected type if it's selected
                                    this._phoneNumberType.next(updatedPhoneNumberType);

                                    // Return the updated type
                                    return updatedPhoneNumberType;
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
    deletePhoneNumberType(id: string): Observable<boolean> {
        return this.phoneNumberTypes$.pipe(
            take(1),
            switchMap((phoneNumberTypes) =>
                this._httpClient
                    .delete('api/master-data/general/phone-number-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                           
                            // Find the index of the deleted type
                            const index = phoneNumberTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the type
                            phoneNumberTypes.splice(index, 1);

                            // Update the phone number types
                            this._phoneNumberTypes.next(phoneNumberTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
