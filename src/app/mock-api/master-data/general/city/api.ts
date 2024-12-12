import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { cities as citiesData } from 'app/mock-api/master-data/general/city/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCityMockApi {
    private _cities: any[] = citiesData;

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
        // @ City - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/cities', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'cityName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the cities
                let cities: any[] | null = cloneDeep(this._cities);

                // Sort the cities
                if (
                    sort === 'cityName' ||
                    sort === 'formalName' ||
                    sort === 'isoAlpha3Code' ||
                    sort === 'isoNumericCode' ||
                    sort === 'cityTypeID' ||
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
                    cities.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    cities.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the cities
                    cities = cities.filter(
                        (city) =>
                            city.cityName &&
                            city.cityName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const citiesLength = cities.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), citiesLength);
                const lastPage = Math.max(Math.ceil(citiesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // city types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    cities = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    cities = cities.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: citiesLength,
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
                        cities,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ City - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/city')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the cities
                const cities = cloneDeep(this._cities);

                // Find the city 
                const city = cities.find((item) => item.id === id);

                // Return the response
                return [200, city];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ City - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/city')
            .reply(() => {
                // Generate a new city 
                const newCity = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    cityName: 'A New City',
                    formalName: '',
                    isoAlpa3Code: '',
                    isoNumericCode: '',
                    cityTypeID: '',
                    latestRecordedPopulation: '',
                    continent: '',
                    region: '',
                    subregion: '',
                    border: '',
                    lastEditedBy: 'Admin',
                    validFrom: '',
                    validTo: '',
                };

                // Unshift the new city 
                this._cities.unshift(newCity);

                // Return the response
                return [200, newCity];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ City Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/city')
            .reply(({ request }) => {
                // Get the id and city type data
                const id = request.body.id;
                const city = cloneDeep(request.body.city);

                // Prepare the updated city 
                let updatedCity = null;

                // Find the city and update it
                this._cities.forEach((item, index, cities) => {
                    if (item.id === id) {
                        // Update the city 
                        cities[index] = assign(
                            {},
                            cities[index],
                            city
                        );

                        // Store the updated city 
                        updatedCity = cities[index];
                    }
                });

                // Return the response
                return [200, updatedCity];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ City - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/city')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the city and delete it
                this._cities.forEach((item, index) => {
                    if (item.id === id) {
                        this._cities.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
