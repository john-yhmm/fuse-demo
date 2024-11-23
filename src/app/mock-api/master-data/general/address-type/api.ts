import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { addressTypes as addressTypesData } from 'app/mock-api/master-data/general/address-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralAddressTypeMockApi {
    private _addressTypes: any[] = addressTypesData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
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
        // @ addressTypes - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/address-types', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'addressTypeName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the addressTypes
                let addressTypes: any[] | null = cloneDeep(this._addressTypes);

                // Sort the addressTypes
                if (
                    sort === 'addressTypeName' ||
                    sort === 'rowguid' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    addressTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    addressTypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the addressTypes
                    addressTypes = addressTypes.filter(
                        (addressType) =>
                            addressType.addressTypeName &&
                            addressType.addressTypeName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const addressTypesLength = addressTypes.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), addressTypesLength);
                const lastPage = Math.max(Math.ceil(addressTypesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // addressTypes but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    addressTypes = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    addressTypes = addressTypes.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: addressTypesLength,
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
                        addressTypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ addressType - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/address-type')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the addressTypes
                const addressTypes = cloneDeep(this._addressTypes);

                // Find the addressType
                const addressType = addressTypes.find((item) => item.id === id);

                // Return the response
                return [200, addressType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ addressType - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/address-type')
            .reply(() => {
                // Generate a new addressType
                const newAddressType = {
                    id: FuseMockApiUtils.guid(),
                    addressTypeName: 'A New Address Type',
                    rowguid: '',
                    lastEditedBy: '',
                    lastEditedOn: '',
                };

                // Unshift the new addressType
                this._addressTypes.unshift(newAddressType);

                // Return the response
                return [200, newAddressType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ addressType - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/address-type')
            .reply(({ request }) => {
                // Get the id and addressType
                const id = request.body.id;
                const addressType = cloneDeep(request.body.addressType);

                // Prepare the updated addressType
                let updatedAddressType = null;

                // Find the addressType and update it
                this._addressTypes.forEach((item, index, addressTypes) => {
                    if (item.id === id) {
                        // Update the addressType
                        addressTypes[index] = assign(
                            {},
                            addressTypes[index],
                            addressType
                        );

                        // Store the updated addressType
                        updatedAddressType = addressTypes[index];
                    }
                });

                // Return the response
                return [200, updatedAddressType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ addressType - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/address-type')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the addressType and delete it
                this._addressTypes.forEach((item, index) => {
                    if (item.id === id) {
                        this._addressTypes.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
