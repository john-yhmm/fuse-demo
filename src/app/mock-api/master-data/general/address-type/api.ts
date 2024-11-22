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
        // @ Languages - GET
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

                // Clone the languages
                let addressTypes: any[] | null = cloneDeep(this._addressTypes);

                // Sort the languages
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
                    // Filter the languages
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
                // languages but also send the last possible page so
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
        // @ Language - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/address-type')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the languages
                const addressTypes = cloneDeep(this._addressTypes);

                // Find the language
                const addressType = addressTypes.find((item) => item.id === id);

                // Return the response
                return [200, addressType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/address-type')
            .reply(() => {
                // Generate a new language
                const newAddressType = {
                    id: FuseMockApiUtils.guid(),
                    languageCode: '',
                    name: 'A New Address Type',
                    modifiedDate: '',
                };

                // Unshift the new language
                this._addressTypes.unshift(newAddressType);

                // Return the response
                return [200, newAddressType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/address-type')
            .reply(({ request }) => {
                // Get the id and language
                const id = request.body.id;
                const addressType = cloneDeep(request.body.addressType);

                // Prepare the updated language
                let updatedAddressType = null;

                // Find the language and update it
                this._addressTypes.forEach((item, index, addressTypes) => {
                    if (item.id === id) {
                        // Update the language
                        addressTypes[index] = assign(
                            {},
                            addressTypes[index],
                            addressType
                        );

                        // Store the updated language
                        updatedAddressType = addressTypes[index];
                    }
                });

                // Return the response
                return [200, updatedAddressType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/address-type')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the language and delete it
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
