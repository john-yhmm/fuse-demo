import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { geoLocations as geoLocationsData } from 'app/mock-api/master-data/general/geo-location/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralGeoLocationMockApi {
    private _geoLocations: any[] = geoLocationsData;

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
            .onGet('api/master-data/general/geo-locations', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'geoLocationValue';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the country types
                let geoLocations: any[] | null = cloneDeep(this._geoLocations);

                // Sort the country types
                if (
                    sort === 'geoLocationValue' ||
                    sort === 'description' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    geoLocations.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    geoLocations.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the country types
                    geoLocations = geoLocations.filter(
                        (geoLocation) =>
                            geoLocation.geoLocationValue &&
                            geoLocation.geoLocationValue
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const geoLocationsLength = geoLocations.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), geoLocationsLength);
                const lastPage = Math.max(Math.ceil(geoLocationsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // country types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    geoLocations = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    geoLocations = geoLocations.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: geoLocationsLength,
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
                        geoLocations,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/geo-location')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the country types
                const geoLocations = cloneDeep(this._geoLocations);

                // Find the country type
                const geoLocation = geoLocations.find((item) => item.id === id);

                // Return the response
                return [200, geoLocation];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/geo-location')
            .reply(() => {
                // Generate a new country type
                const newGeoLocation = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    geoLocationValue : 'New Geo Location',
                    description : '',
                    lastEditedBy: 'Admin',
                    lastEditedOn: '',
                };

                // Unshift the new country type
                this._geoLocations.unshift(newGeoLocation);

                // Return the response
                return [200, newGeoLocation];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/geo-location')
            .reply(({ request }) => {
                // Get the id and country type data
                const id = request.body.id;
                const geoLocation = cloneDeep(request.body.geoLocation);

                // Prepare the updated country type
                let updatedGeoLocation = null;

                // Find the country type and update it
                this._geoLocations.forEach((item, index, geoLocations) => {
                    if (item.id === id) {
                        // Update the country type
                        geoLocations[index] = assign(
                            {},
                            geoLocations[index],
                            geoLocation
                        );

                        // Store the updated country type
                        updatedGeoLocation = geoLocations[index];
                    }
                });

                // Return the response
                return [200, updatedGeoLocation];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/geo-location')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the country type and delete it
                this._geoLocations.forEach((item, index) => {
                    if (item.id === id) {
                        this._geoLocations.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
