import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { people as peopleData } from 'app/mock-api/master-data/general/people/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralPeopleMockAPi {
    private _peoples: any[] = peopleData;

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
        // @ People - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/peoples', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'searchName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the people
                let peoples: any[] | null = cloneDeep(this._peoples);

                // Sort the people
                if (
                    sort === 'id' ||
                    sort === 'fullName' ||
                    sort === 'preferredName' ||
                    sort === 'searchName' ||
                    sort === 'isPermittedToLogon' ||
                    sort === 'logonName' ||
                    sort === 'isExternalLogonProvider' ||
                    sort === 'hashedPassword' ||
                    sort === 'isSystemUser' ||
                    sort === 'isEmployee' ||
                    sort === 'isSalesPerson' ||
                    sort === 'userPreferences' ||
                    sort === 'contactId' ||
                    sort === 'photo' ||
                    sort === 'customFields' ||
                    sort === 'languageId' ||
                    sort === 'lastEditedBy' ||
                    sort === 'validFrom' ||
                    sort === 'validTo'
                ) {
                    peoples.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    peoples.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the people
                    peoples = peoples.filter(
                        (people) =>
                            people.searchName &&
                            people.searchName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const peoplesLength = peoples.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), peoplesLength);
                const lastPage = Math.max(Math.ceil(peoplesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // contacts but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    peoples = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    peoples = peoples.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: peoplesLength,
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
                        peoples,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ People - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/people')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the people
                const peoples = cloneDeep(this._peoples);

                // Find the person
                const people = peoples.find((item) => item.id === id);

                // Return the response
                return [200, people];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ People - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/people')
            .reply(() => {
                // Generate a new person
                const newPeople = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    fullName: '',
                    preferredName: '',
                    searchName: '',
                    isPermittedToLogon: false,
                    logonName: '',
                    isExternalLogonProvider: false,
                    hashedPassword: '',
                    isSystemUser: false,
                    isEmployee: false,
                    isSalesPerson: false,
                    userPreferences: '',
                    contactId: '',
                    photo: '',
                    customFields: '',
                    languageId: '',
                    lastEditedBy: 'Admin',
                    validFrom: new Date().toISOString(),
                    validTo: new Date().toISOString(),
                    // Current timestamp
                };

                // Unshift the new contact to the contacts array
                this._peoples.unshift(newPeople);

                // Return the response
                return [200, newPeople];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ People - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/people')
            .reply(({ request }) => {
                // Get the id and contact data
                const id = request.body.id;
                const people = cloneDeep(request.body.people);

                // Prepare the updated contact
                let updatedPeople = null;

                // Find the contact and update it
                this._peoples.forEach((item, index, peoples) => {
                    if (item.id === id) {
                        // Update the contact
                        peoples[index] = assign({}, peoples[index], people);

                        // Store the updated contact
                        updatedPeople = peoples[index];
                    }
                });

                // Return the response
                return [200, updatedPeople];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ People - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/people')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the person and delete it
                this._peoples.forEach((item, index) => {
                    if (item.id === id) {
                        this._peoples.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
