import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { countrys as countrysData } from 'app/mock-api/master-data/general/country/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCountryMockApi {
    private _countrys: any[] = countrysData;

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
            .onGet('api/master-data/general/countrys', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'countryName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the countrys
                let countrys: any[] | null = cloneDeep(this._countrys);

                // Sort the countrys
                if (
                    sort === 'countryName' ||
                    sort === 'formalName' ||
                    sort === 'isoAlpha3Code' ||
                    sort === 'isoNumericCode' ||
                    sort === 'countryTypeID' ||
                    sort === 'latesetRecordedPopulation' ||
                    sort === 'continent' ||
                    sort === 'region' ||
                    sort === 'subregion' ||
                    sort === 'border' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn' ||
                    sort === 'validFrom' ||
                    sort === 'validTo'

                ) {
                    countrys.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    countrys.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the countrys
                    countrys = countrys.filter(
                        (country) =>
                            country.countryName &&
                            country.countryName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const countrysLength = countrys.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), countrysLength);
                const lastPage = Math.max(Math.ceil(countrysLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // country types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    countrys = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    countrys = countrys.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: countrysLength,
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
                        countrys,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/country')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the countrys
                const countrys = cloneDeep(this._countrys);

                // Find the country 
                const country = countrys.find((item) => item.id === id);

                // Return the response
                return [200, country];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/country')
            .reply(() => {
                // Generate a new country 
                const newCountry = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    countryName: 'A New Country',
                    formalName: '',
                    isoAlpa3Code: '',
                    isoNumericCode: '',
                    countryTypeID: '',
                    latestRecordedPopulation: '',
                    continent: '',
                    region: '',
                    subregion: '',
                    border: '',
                    lastEditedBy: 'Admin',
                    validFrom: '',
                    validTo: '',
                };

                // Unshift the new country 
                this._countrys.unshift(newCountry);

                // Return the response
                return [200, newCountry];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/country')
            .reply(({ request }) => {
                // Get the id and country type data
                const id = request.body.id;
                const country = cloneDeep(request.body.country);

                // Prepare the updated country 
                let updatedCountry = null;

                // Find the country and update it
                this._countrys.forEach((item, index, countrys) => {
                    if (item.id === id) {
                        // Update the country 
                        countrys[index] = assign(
                            {},
                            countrys[index],
                            country
                        );

                        // Store the updated country 
                        updatedCountry = countrys[index];
                    }
                });

                // Return the response
                return [200, updatedCountry];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/country')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the country and delete it
                this._countrys.forEach((item, index) => {
                    if (item.id === id) {
                        this._countrys.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
