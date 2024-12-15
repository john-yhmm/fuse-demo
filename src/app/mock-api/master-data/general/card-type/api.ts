import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { cardTypes as cardTypesData } from 'app/mock-api/master-data/general/card-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCardTypeMockApi {
    private _cardTypes: any[] = cardTypesData;

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
        // @ Card Types - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/card-types', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the card types
                let cardTypes: any[] | null = cloneDeep(this._cardTypes);

                // Sort the card types
                if (
                    sort === 'name' ||
                    sort === 'issuerId' ||
                    sort === 'modifiedDate'
                ) {
                    cardTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    cardTypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the card types
                    cardTypes = cardTypes.filter(
                        (cardType) =>
                            cardType.name &&
                            cardType.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const cardTypesLength = cardTypes.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), cardTypesLength);
                const lastPage = Math.max(Math.ceil(cardTypesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // card types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    cardTypes = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    cardTypes = cardTypes.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: cardTypesLength,
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
                        cardTypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card Type - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/card-type')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the card types
                const cardTypes = cloneDeep(this._cardTypes);

                // Find the card type
                const cardType = cardTypes.find((item) => item.id === id);

                // Return the response
                return [200, cardType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card Type - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/card-type')
            .reply(() => {
                // Generate a new card type
                const newcardType = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    name: 'A new card',
                    issuerId: '',
                    modifiedDate: '',
                };

                // Unshift the new card type
                this._cardTypes.unshift(newcardType);

                // Return the response
                return [200, newcardType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/card-type')
            .reply(({ request }) => {
                // Get the id and card type data
                const id = request.body.id;
                const cardType = cloneDeep(request.body.cardType);

                // Prepare the updated card type
                let updatedCardType = null;

                // Find the card type and update it
                this._cardTypes.forEach((item, index, cardTypes) => {
                    if (item.id === id) {
                        // Update the card type
                        cardTypes[index] = assign(
                            {},
                            cardTypes[index],
                            cardType
                        );

                        // Store the updated card type
                        updatedCardType = cardTypes[index];
                    }
                });

                // Return the response
                return [200, updatedCardType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card Type - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/card-type')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the card type and delete it
                this._cardTypes.forEach((item, index) => {
                    if (item.id === id) {
                        this._cardTypes.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
