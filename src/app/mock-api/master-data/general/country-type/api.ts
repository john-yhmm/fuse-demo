import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { countryTypes as countryTypesData } from 'app/mock-api/master-data/general/country-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCountryTypeMockApi {
    private _countryTypes: any[] = countryTypesData;

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
        // @ Country Types - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/country-types', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'countryTypeName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the country types
                let countryTypes: any[] | null = cloneDeep(this._countryTypes);

                // Sort the country types
                if (
                    sort === 'countryTypeName' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    countryTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    countryTypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the country types
                    countryTypes = countryTypes.filter(
                        (countryType) =>
                            countryType.countryTypeName &&
                            countryType.countryTypeName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const countryTypesLength = countryTypes.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), countryTypesLength);
                const lastPage = Math.max(Math.ceil(countryTypesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // country types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    countryTypes = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    countryTypes = countryTypes.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: countryTypesLength,
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
                        countryTypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/country-type')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the country types
                const countryTypes = cloneDeep(this._countryTypes);

                // Find the country type
                const countryType = countryTypes.find((item) => item.id === id);

                // Return the response
                return [200, countryType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/country-type')
            .reply(() => {
                // Generate a new country type
                const newCountryType = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    countryTypeName: 'A New Country Type',
                    lastEditedBy: 'Admin',
                    lastEditedOn: '',
                };

                // Unshift the new country type
                this._countryTypes.unshift(newCountryType);

                // Return the response
                return [200, newCountryType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/country-type')
            .reply(({ request }) => {
                // Get the id and country type data
                const id = request.body.id;
                const countryType = cloneDeep(request.body.countryType);

                // Prepare the updated country type
                let updatedCountryType = null;

                // Find the country type and update it
                this._countryTypes.forEach((item, index, countryTypes) => {
                    if (item.id === id) {
                        // Update the country type
                        countryTypes[index] = assign(
                            {},
                            countryTypes[index],
                            countryType
                        );

                        // Store the updated country type
                        updatedCountryType = countryTypes[index];
                    }
                });

                // Return the response
                return [200, updatedCountryType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/country-type')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the country type and delete it
                this._countryTypes.forEach((item, index) => {
                    if (item.id === id) {
                        this._countryTypes.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
