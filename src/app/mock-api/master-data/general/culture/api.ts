import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { cultures as culturesData } from 'app/mock-api/master-data/general/culture/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCultureMockApi {
    private _cultures: any[] = culturesData;

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
        // @ Cultures - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/cultures', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the cultures
                let cultures: any[] | null = cloneDeep(this._cultures);

                // Sort the cultures
                if (
                    sort === 'cultureCode' ||
                    sort === 'name' ||
                    sort === 'status' ||
                    sort === 'modifiedDate'
                ) {
                    cultures.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    cultures.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the cultures
                    cultures = cultures.filter(
                        (culture) =>
                            culture.name &&
                            culture.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const culturesLength = cultures.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), culturesLength);
                const lastPage = Math.max(Math.ceil(culturesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // cultures but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    cultures = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    cultures = cultures.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: culturesLength,
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
                        cultures,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Culture - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/culture')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the cultures
                const cultures = cloneDeep(this._cultures);

                // Find the culture
                const culture = cultures.find((item) => item.id === id);

                // Return the response
                return [200, culture];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Culture - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/culture')
            .reply(() => {
                // Generate a new culture
                const newCulture = {
                    id: FuseMockApiUtils.guid(),
                    cultureCode: '',
                    name: 'A New Culture',
                    modifiedDate: '',
                };

                // Unshift the new culture
                this._cultures.unshift(newCulture);

                // Return the response
                return [200, newCulture];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Culture - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/culture')
            .reply(({ request }) => {
                // Get the id and culture
                const id = request.body.id;
                const culture = cloneDeep(request.body.culture);

                // Prepare the updated culture
                let updatedCulture = null;

                // Find the culture and update it
                this._cultures.forEach((item, index, cultures) => {
                    if (item.id === id) {
                        // Update the culture
                        cultures[index] = assign(
                            {},
                            cultures[index],
                            culture
                        );

                        // Store the updated culture
                        updatedCulture = cultures[index];
                    }
                });

                // Return the response
                return [200, updatedCulture];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Culture - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/culture')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the culture and delete it
                this._cultures.forEach((item, index) => {
                    if (item.id === id) {
                        this._cultures.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
