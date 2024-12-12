import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { stateProvinces as stateProvincesData } from 'app/mock-api/master-data/general/state-province/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralStateProvinceMockApi {
    private _stateProvinces: any[] = stateProvincesData;

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
        // @ Country - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/state-provinces', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'stateProvinceName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the countrys
                let stateProvinces: any[] | null = cloneDeep(this._stateProvinces);

                // Sort the countrys
                if (
                    sort === 'stateProvinceCode' ||
                    sort === 'stateProvinceName' ||
                    sort === 'countryId' ||
                    sort === 'salesTerritoryId' ||
                    sort === 'border' ||
                    sort === 'latesetRecordedPopulation' ||
                    sort === 'rowguid' ||
                    sort === 'lastEditedBy' ||
                    sort === 'validFrom' ||
                    sort === 'validTo'

                ) {
                    stateProvinces.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    stateProvinces.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the countrys
                    stateProvinces = stateProvinces.filter(
                        (stateProvince) =>
                            stateProvince.stateProvinceName &&
                            stateProvince.stateProvinceName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const stateProvincesLength = stateProvinces.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), stateProvincesLength);
                const lastPage = Math.max(Math.ceil(stateProvincesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // country types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    stateProvinces = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    stateProvinces = stateProvinces.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: stateProvincesLength,
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
                        stateProvinces,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/state-province')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the countrys
                const stateProvinces = cloneDeep(this._stateProvinces);

                // Find the stateProvince 
                const stateProvince = stateProvinces.find((item) => item.id === id);

                // Return the response
                return [200, stateProvince];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/state-province')
            .reply(() => {
                // Generate a new country 
                const newStateProvince = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    stateProvinceCode: 'A New Country',
                    stateProvinceName: '',
                    countryId: '',
                    salesTerritoryId: '',
                    border: '',
                    latestRecordedPopulation: '',
                    rowguid: '',
                    lastEditedBy: 'Admin',
                    validFrom: '',
                    validTo: '',
                };

                // Unshift the new country 
                this._stateProvinces.unshift(newStateProvince);

                // Return the response
                return [200, newStateProvince];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/state-province')
            .reply(({ request }) => {
                // Get the id and country type data
                const id = request.body.id;
                const stateProvince = cloneDeep(request.body.stateProvince);

                // Prepare the updated country 
                let updatedStateProvince = null;

                // Find the country and update it
                this._stateProvinces.forEach((item, index, stateProvinces) => {
                    if (item.id === id) {
                        // Update the country 
                        stateProvinces[index] = assign(
                            {},
                            stateProvinces[index],
                            stateProvince
                        );

                        // Store the updated stateProvince 
                        updatedStateProvince = stateProvinces[index];
                    }
                });

                // Return the response
                return [200, updatedStateProvince];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/state-province')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the country and delete it
                this._stateProvinces.forEach((item, index) => {
                    if (item.id === id) {
                        this._stateProvinces.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
