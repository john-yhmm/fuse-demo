import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { addresses as addressesData } from 'app/mock-api/master-data/general/address/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralAddressMockApi {
    private _addresses: any[] = addressesData;

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Address - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/addresses', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'addressTypeId';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the addresses
                let addresses: any[] | null = cloneDeep(this._addresses);

                // Sort the addresses
                if (
                    sort === 'addressTypeId' ||
                    sort === 'addressLine1' ||
                    sort === 'addressLine2' ||
                    sort === 'cityId' ||
                    sort === 'stateProvinceId' ||
                    sort === 'rowguid' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'

                ) {
                    addresses.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    addresses.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the addresses
                    addresses = addresses.filter(
                        (address) =>
                            address.addressTypeId &&
                            address.addressTypeId
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const addressesLength = addresses.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), addressesLength);
                const lastPage = Math.max(Math.ceil(addressesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // address types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    addresses = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    addresses = addresses.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: addressesLength,
                        size: size,
                        page: page,
                        lastPage: lastPage,
                        startIndex: begin,
                        endIndex: end - 1,
                    };
                }

                // Return the response
                return [
                    200,
                    {
                        addresses,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Address - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/address')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the addresses
                const addresses = cloneDeep(this._addresses);

                // Find the address 
                const address = addresses.find((item) => item.id === id);

                // Return the response
                return [200, address];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Address - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/address')
            .reply(() => {
                // Generate a new address 
                const newAddress = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    addressTypeId: '',
                    addressLine1: 'New Address',
                    addressLine2: '',
                    cityId: '',
                    stateProvinceId: '',
                    rowguid: '',
                    lastEditedBy: 'Admin',
                    lasteditedOn: '',
                };

                // Unshift the new address 
                this._addresses.unshift(newAddress);

                // Return the response
                return [200, newAddress];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Address Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/address')
            .reply(({ request }) => {
                // Get the id and address type data
                const id = request.body.id;
                const address = cloneDeep(request.body.address);

                // Prepare the updated address 
                let updatedAddress = null;

                // Find the address and update it
                this._addresses.forEach((item, index, addresses) => {
                    if (item.id === id) {
                        // Update the address 
                        addresses[index] = assign(
                            {},
                            addresses[index],
                            address
                        );

                        // Store the updated address 
                        updatedAddress = addresses[index];
                    }
                });

                // Return the response
                return [200, updatedAddress];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Address - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/address')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the address and delete it
                this._addresses.forEach((item, index) => {
                    if (item.id === id) {
                        this._addresses.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
