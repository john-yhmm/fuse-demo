import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { contacts as contactData } from 'app/mock-api/master-data/general/contact/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralContactMockAPi {
    private _contacts: any[] = contactData;

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
            .onGet('api/master-data/general/contacts', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'stateProvinceName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the countrys
                let contacts: any[] | null = cloneDeep(this._contacts);

                // Sort the countrys
                if (
                    sort === 'id' ||
                    sort === 'contactTypeId' ||
                    sort === 'phoneNumber' ||
                    sort === 'phoneNumberTypeId' ||
                    sort === 'faxNumber' ||
                    sort === 'emailAddress' ||
                    sort === 'websiteUrl' ||
                    sort === 'customFields' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    contacts.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    contacts.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the contacts
                    contacts = contacts.filter(
                        (contact) =>
                            contact.emailAddress &&
                            contact.emailAddress
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const contactsLength = contacts.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), contactsLength);
                const lastPage = Math.max(Math.ceil(contactsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // contacts but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    contacts = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    contacts = contacts.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: contactsLength,
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
                        contacts,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/contact')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the contacts
                const contacts = cloneDeep(this._contacts);

                // Find the contact
                const contact = contacts.find((item) => item.id === id);

                // Return the response
                return [200, contact];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/contact')
            .reply(() => {
                // Generate a new contact
                const newContact = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    contactTypeId: '',
                    phoneNumber: '',
                    phoneNumberTypeId: '',
                    faxNumber: '',
                    emailAddress: '',
                    websiteUrl: '',
                    customFields: '',
                    lastEditedBy: 'Admin',
                    lastEditedOn: new Date().toISOString(), // Current timestamp
                };

                // Unshift the new contact to the contacts array
                this._contacts.unshift(newContact);

                // Return the response
                return [200, newContact];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Contact - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/contact')
            .reply(({ request }) => {
                // Get the id and contact data
                const id = request.body.id;
                const contact = cloneDeep(request.body.contact);

                // Prepare the updated contact
                let updatedContact = null;

                // Find the contact and update it
                this._contacts.forEach((item, index, contacts) => {
                    if (item.id === id) {
                        // Update the contact
                        contacts[index] = assign({}, contacts[index], contact);

                        // Store the updated contact
                        updatedContact = contacts[index];
                    }
                });

                // Return the response
                return [200, updatedContact];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Contact - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/contact')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the contact and delete it
                this._contacts.forEach((item, index) => {
                    if (item.id === id) {
                        this._contacts.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
