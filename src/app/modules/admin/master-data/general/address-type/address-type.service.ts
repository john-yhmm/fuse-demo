import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    AddressType,
    AddressTypePagination,
} from 'app/modules/admin/master-data/general/address-type/address-type.types';
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
export class AddressTypeService {
    // Private
    private _pagination: BehaviorSubject<AddressTypePagination | null> =
        new BehaviorSubject(null);
    private _addressType: BehaviorSubject<AddressType | null> = new BehaviorSubject(
        null
    );
    private _addressTypes: BehaviorSubject<AddressType[] | null> =
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
    get pagination$(): Observable<AddressTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for addressType
     */
    get addressType$(): Observable<AddressType> {
        return this._addressType.asObservable();
    }

    /**
     * Getter for addressTypes
     */
    get addressTypes$(): Observable<AddressType[]> {
        return this._addressTypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get addressTypes
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getAddressTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'addressTypeName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: AddressTypePagination;
        addressTypes: AddressType[];
    }> {
        return this._httpClient
            .get<{
                pagination: AddressTypePagination;
                addressTypes: AddressType[];
            }>('api/master-data/general/addressTypes', {
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
                    this._addressTypes.next(response.addressTypes);
                })
            );
    }

    /**
     * Get addressType by id
     */
    getAddressTypeById(id: string): Observable<AddressType> {
        return this._addressTypes.pipe(
            take(1),
            map((addressTypes) => {
                // Find the addressType
                const addressType =
                    addressTypes.find((item) => item.id === id) || null;

                // Update the addressType
                this._addressType.next(addressType);

                // Return the addressType
                return addressType;
            }),
            switchMap((addressType) => {
                if (!addressType) {
                    return throwError(
                        'Could not found addressType with id of ' + id + '!'
                    );
                }

                return of(addressType);
            })
        );
    }

    /**
     * Create addressType
     */
    createAddressType(): Observable<AddressType> {
        return this.addressTypes$.pipe(
            take(1),
            switchMap((addressTypes) =>
                this._httpClient
                    .post<AddressType>('api/master-data/general/addressType', {})
                    .pipe(
                        map((newAddressType) => {
                            // Update the addressTypes with the new addressType
                            this._addressTypes.next([newAddressType, ...addressTypes]);

                            // Return the new addressType
                            return newAddressType;
                        })
                    )
            )
        );
    }

    /**
     * Update addressType
     *
     * @param id
     * @param addressType
     */
    updateAddressType(id: string, addressType: AddressType): Observable<AddressType> {
        return this.addressTypes$.pipe(
            take(1),
            switchMap((addressTypes) =>
                this._httpClient
                    .patch<AddressType>('api/master-data/general/addressType', {
                        id,
                        addressType,
                    })
                    .pipe(
                        map((updatedAddressType) => {
                            // Find the index of the updated addressType
                            const index = addressTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the addressType
                            addressTypes[index] = updatedAddressType;

                            // Update the addressTypes
                            this._addressTypes.next(addressTypes);

                            // Return the updated addressType
                            return updatedAddressType;
                        }),
                        switchMap((updatedAddressType) =>
                            this.addressType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the addressType if it's selected
                                    this._addressType.next(updatedAddressType);

                                    // Return the updated addressType
                                    return updatedAddressType;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the addressType
     *
     * @param id
     */
    deleteAddressType(id: string): Observable<boolean> {
        return this.addressTypes$.pipe(
            take(1),
            switchMap((addressTypes) =>
                this._httpClient
                    .delete('api/master-data/general/addressType', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted addressType
                            const index = addressTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the addressType
                            addressTypes.splice(index, 1);

                            // Update the addressTypes
                            this._addressTypes.next(addressTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
