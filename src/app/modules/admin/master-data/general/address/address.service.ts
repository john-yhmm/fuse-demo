import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    Address, 
    AddressPagination, 
} from 'app/modules/admin/master-data/general/address/address.types';
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
export class AddressService {
    // Private
    private _pagination: BehaviorSubject<AddressPagination | null> =
        new BehaviorSubject(null);
    private _address: BehaviorSubject<Address | null> = new BehaviorSubject(null);
    private _addresses: BehaviorSubject<Address[] | null> = new BehaviorSubject(null);

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
    get pagination$(): Observable<AddressPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for address
     */
    get address$(): Observable<Address> {
        return this._address.asObservable();
    }

    /**
     * Getter for addresses
     */
    get addresses$(): Observable<Address[]> {
        return this._addresses.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get address 
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getAddresses(
        page: number = 0,
        size: number = 10,
        sort: string = 'addressTypeId',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: AddressPagination;
        addresses: Address[];
    }> {
        return this._httpClient
            .get<{
                pagination: AddressPagination;
                addresses: Address[];
            }>('api/master-data/general/addresses', {
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
                    this._addresses.next(response.addresses);
                })
            );
    }

    /**
     * Get address type by id
     */
    getAddressById(id: string): Observable<Address> {
        return this._addresses.pipe(
            take(1),
            map((addresses) => {
                // Find the address 
                const address =
                    addresses.find((item) => item.id === id) || null;

                // Update the address 
                this._address.next(address);

                // Return the address 
                return address;
            }),
            switchMap((address) => {
                if (!address) {
                    return throwError(
                        'Could not found address with id of ' + id + '!'
                    );
                }

                return of(address);
            })
        );
    }

    /**
     * Create address type
     */
    createAddress(): Observable<Address> {
        return this._httpClient
            .post<Address>('api/master-data/general/address', {})
            .pipe(
                tap((newAddress) => {
                    // Ensure newAddress.id is defined
                    if (!newAddress.id) {
                        console.error('Newly created address lacks an ID');
                        return;
                    }
                    const currentAddresses = this._addresses.getValue();
                    this._addresses.next([newAddress, ...currentAddresses]);
                })
            );
    }
    
    /**
     * Update address type
     *
     * @param id
     * @param address
     */
    updateAddress(id: string, address: Address): Observable<Address> {
        console.log('Sending PATCH request:', { id, address });
      
        return this._httpClient.patch<Address>(
          'api/master-data/general/address', 
          { id, address }
        ).pipe(
          tap((updatedAddress) => {
            console.log('PATCH response received:', updatedAddress);
      
            // Update the _addresses BehaviorSubject with the updated address type
            const currentAddresses = this._addresses.getValue(); // Get the current address types
            const index = currentAddresses.findIndex((ct) => ct.id === id); // Find the index of the updated address
      
            if (index !== -1) {
              currentAddresses[index] = updatedAddress; // Update the address type in the list
              this._addresses.next(currentAddresses); // Emit the updated list
            }
          })
        );
      }
      
    /**
     * Delete the address 
     *
     * @param id
     */
    deleteAddress(id: string): Observable<boolean> {
        console.log('Attempting to delete address with ID:', id);
        return this.addresses$.pipe(
            take(1),
            switchMap((addresses) =>
                this._httpClient
                    .delete('api/master-data/general/address', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted address type
                            const index = addresses.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the address type
                            addresses.splice(index, 1);

                            // Update the address types
                            this._addresses.next(addresses);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}