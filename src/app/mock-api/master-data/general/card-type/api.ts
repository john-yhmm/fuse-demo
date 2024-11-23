import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { cardTypes as cardTypesData } from 'app/mock-api/master-data/general/card-type/data';
import { assign, cloneDeep } from 'lodash-es';
@Injectable({ providedIn: 'root' })
export class GeneralCardTypeMockApi {
    private _cardTypes: any[] = cardTypesData;
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
        // @ cardTypes - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/card-types', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'cardTypeName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);
                // Clone the cardTypes
                let cardTypes: any[] | null = cloneDeep(this._cardTypes);
                // Sort the cardTypes
                if (
                    sort === 'cardTypeName' ||
                    sort === 'issuerID' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
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
                    // Filter the cardTypes
                    cardTypes = cardTypes.filter(
                        (cardType) =>
                            cardType.cardTypeName &&
                            cardType.cardTypeName
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
                // languages but also send the last possible page so
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
        // @ cardTypes - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/card-types')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');
                // Clone the cardTypes
                const cardTypes = cloneDeep(this._cardTypes);
                // Find the cardTypes
                const cardType = cardTypes.find((item) => item.id === id);
                // Return the response
                return [200, cardType];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ cardTypes - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/card-types')
            .reply(() => {
                // Generate a new cardTypes
                const newCardType = {
                    id: FuseMockApiUtils.guid(),
                    languageCode: '',
                    name: 'A New Card Type',
                    modifiedDate: '',
                };
                // Unshift the new cardTypes
                this._cardTypes.unshift(newCardType);
                // Return the response
                return [200, newCardType];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ cardTypes - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/card-types')
            .reply(({ request }) => {
                // Get the id and cardTypes
                const id = request.body.id;
                const cardType = cloneDeep(request.body.cardType);
                // Prepare the updated cardTypes
                let updatedCardType = null;
                // Find the cardTypes and update it
                this._cardTypes.forEach((item, index, cardTypes) => {
                    if (item.id === id) {
                        // Update the cardTypes
                        cardTypes[index] = assign(
                            {},
                            cardTypes[index],
                            cardType
                        );
                        // Store the updated cardTypes
                        updatedCardType = cardTypes[index];
                    }
                });
                // Return the response
                return [200, updatedCardType];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ cardTypes - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/card-types')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');
                // Find the cardTypes and delete it
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
