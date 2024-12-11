import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { countryRegions as countryRegionsData } from 'app/mock-api/master-data/general/country-region/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCountryRegionMockApi {
    private _countryRegions: any[] = countryRegionsData;

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
        // @ countryRegions - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/countryRegions', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the countryRegions
                let countryRegions: any[] | null = cloneDeep(this._countryRegions);

                // Sort the countryRegions
                if (
                    sort === 'countryRegionCode' ||
                    sort === 'name' ||
                    sort === 'modifiedDate'
                ) {
                    countryRegions.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    countryRegions.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the countryRegions
                    countryRegions = countryRegions.filter(
                        (countryRegion) =>
                            countryRegion.name &&
                            countryRegion.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const countryRegionsLength = countryRegions.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), countryRegionsLength);
                const lastPage = Math.max(Math.ceil(countryRegionsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // countryRegions but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    countryRegions = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    countryRegions = countryRegions.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: countryRegionsLength,
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
                        countryRegions,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ countryRegion - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/countryRegion')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the countryRegions
                const countryRegions = cloneDeep(this._countryRegions);

                // Find the countryRegion
                const countryRegion = countryRegions.find((item) => item.id === id);

                // Return the response
                return [200, countryRegion];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ countryRegion - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/countryRegion')
            .reply(() => {
                // Generate a new countryRegion
                const newCountryRegion = {
                    id: FuseMockApiUtils.guid(),
                    countryRegionCode: '',
                    name: 'A New Country Region',
                    modifiedDate: '',
                };

                // Unshift the new countryRegion
                this._countryRegions.unshift(newCountryRegion);

                // Return the response
                return [200, newCountryRegion];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ countryRegion - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/countryRegion')
            .reply(({ request }) => {
                // Get the id and countryRegion
                const id = request.body.id;
                const countryRegion = cloneDeep(request.body.countryRegion);

                // Prepare the updated countryRegion
                let updatedCountryRegion = null;

                // Find the countryRegion and update it
                this._countryRegions.forEach((item, index, countryRegions) => {
                    if (item.id === id) {
                        // Update the countryRegion
                        countryRegions[index] = assign(
                            {},
                            countryRegions[index],
                            countryRegion
                        );

                        // Store the updated countryRegion
                        updatedCountryRegion = countryRegions[index];
                    }
                });

                // Return the response
                return [200, updatedCountryRegion];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ countryRegion - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/countryRegion')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the countryRegion and delete it
                this._countryRegions.forEach((item, index) => {
                    if (item.id === id) {
                        this._countryRegions.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
