import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { creditcardtypes as creditcardtypesData } from 'app/mock-api/master-data/general/creditcardtype/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCreditCardTypeMockApi {
    private _creditcardtypes: any[] = creditcardtypesData;

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
        // @ Languages - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/creditcardtypes', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the languages
                let creditcardtypes: any[] | null = cloneDeep(this._creditcardtypes);

                // Sort the languages
                if (
                    sort === 'name' ||
                    sort === 'modifiedDate'
                ) {
                    creditcardtypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    creditcardtypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the languages
                    creditcardtypes = creditcardtypes.filter(
                        (creditcardtype) =>
                            creditcardtype.name &&
                            creditcardtype.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const creditcardtypesLength = creditcardtypes.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), creditcardtypesLength);
                const lastPage = Math.max(Math.ceil(creditcardtypesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // languages but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    creditcardtypes = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    creditcardtypes = creditcardtypes.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: creditcardtypesLength,
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
                        creditcardtypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/creditcardtype')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the languages
                const creditcardtypes = cloneDeep(this._creditcardtypes);

                // Find the language
                const creditcardtype = creditcardtypes.find((item) => item.id === id);

                // Return the response
                return [200, creditcardtype];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/creditcardtype')
            .reply(() => {
                // Generate a new language
                const newCreditCardType = {
                    id: FuseMockApiUtils.guid(),
                    name: 'A New Credit Card Type',
                    modifiedDate: '',
                };

                // Unshift the new language
                this._creditcardtypes.unshift(newCreditCardType);

                // Return the response
                return [200, newCreditCardType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/creditcardtype')
            .reply(({ request }) => {
                // Get the id and language
                const id = request.body.id;
                const creditcardtype = cloneDeep(request.body.creditcardtype);

                // Prepare the updated language
                let updatedCreditCardType = null;

                // Find the language and update it
                this._creditcardtypes.forEach((item, index, creditcardtypes) => {
                    if (item.id === id) {
                        // Update the language
                        creditcardtypes[index] = assign(
                            {},
                            creditcardtypes[index],
                            creditcardtype
                        );

                        // Store the updated language
                        updatedCreditCardType = creditcardtypes[index];
                    }
                });

                // Return the response
                return [200, updatedCreditCardType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Language - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/creditcardtype')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the language and delete it
                this._creditcardtypes.forEach((item, index) => {
                    if (item.id === id) {
                        this._creditcardtypes.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
