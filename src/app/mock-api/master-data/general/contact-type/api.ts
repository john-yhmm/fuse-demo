import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { contactTypes as contactTypesData } from 'app/mock-api/master-data/general/contact-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class ContactTypeMockApi {
    private _contactTypes: any[] = contactTypesData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenues - GET (List with pagination, search, and sort)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/contact-types', 300)
            .reply(({ request }) => {
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the data
                let contactTypes: any[] | null = cloneDeep(this._contactTypes);

                // Sort
                if (sort === 'name' || sort === 'modifiedDate') {
                    contactTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                }

                // Search
                if (search) {
                    contactTypes = contactTypes.filter((item) =>
                        item.name.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Pagination
                const contactTypesLength = contactTypes.length;
                const begin = page * size;
                const end = Math.min(size * (page + 1), contactTypesLength);
                const lastPage = Math.max(Math.ceil(contactTypesLength / size), 1);

                let pagination = {};
                if (page > lastPage) {
                    contactTypes = null;
                    pagination = { lastPage };
                } else {
                    contactTypes = contactTypes.slice(begin, end);
                    pagination = {
                        length: contactTypesLength,
                        size: size,
                        page: page,
                        lastPage: lastPage,
                        startIndex: begin,
                        endIndex: end - 1,
                    };
                }

                return [200, { contactTypes, pagination }];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - GET (Single)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/contact-type')
            .reply(({ request }) => {
                const id = request.params.get('id');
                const contactTypes = cloneDeep(this._contactTypes);
                const contactType = contactTypes.find((item) => item.id === id);
                return [200, contactType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - POST (Create)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/contact-type')
            .reply(() => {
                const newcontactType = {
                    id: FuseMockApiUtils.guid(),
                    name: 'New Contact Type',
                    modifiedDate: '',
                };
                this._contactTypes.unshift(newcontactType);
                return [200, newcontactType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - PATCH (Update)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/contact-type')
            .reply(({ request }) => {
                const id = request.body.id;
                const contactType = cloneDeep(request.body.contactType);

                let updatedContactType = null;
                this._contactTypes.forEach((item, index, contactTypes) => {
                    if (item.id === id) {
                        contactTypes[index] = assign({}, contactTypes[index], contactType);
                        updatedContactType = contactTypes[index];
                    }
                });

                return [200, updatedContactType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/contact-type')
            .reply(({ request }) => {
                const id = request.params.get('id');
                this._contactTypes.forEach((item, index) => {
                    if (item.id === id) {
                        this._contactTypes.splice(index, 1);
                    }
                });
                return [200, true];
            });
    }
}