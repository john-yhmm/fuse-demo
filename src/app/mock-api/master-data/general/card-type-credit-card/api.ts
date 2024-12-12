import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { cardTypeCreditCards as cardTypeCreditCardsData } from 'app/mock-api/master-data/general/card-type-credit-card/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCardTypeCreditCardMockApi {
    private _cardTypeCreditCards: any[] = cardTypeCreditCardsData;

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
            .onGet('api/master-data/general/card-type-credit-cards', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the countrys
                let cardTypeCreditCards: any[] | null = cloneDeep(this._cardTypeCreditCards);

                // Sort the countrys
                if (
                    sort === 'name' ||
                    sort === 'startNumber' ||
                    sort === 'endNumber' ||
                    sort === 'cardTypeCreditCardID' ||
                    sort === 'modifiedDate' 

                ) {
                    cardTypeCreditCards.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    cardTypeCreditCards.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the countrys
                    cardTypeCreditCards = cardTypeCreditCards.filter(
                        (cardTypeCreditCard) =>
                            cardTypeCreditCard.name &&
                            cardTypeCreditCard.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const cardTypeCreditCardsLength = cardTypeCreditCards.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), cardTypeCreditCardsLength);
                const lastPage = Math.max(Math.ceil(cardTypeCreditCardsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // country types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    cardTypeCreditCards = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    cardTypeCreditCards = cardTypeCreditCards.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: cardTypeCreditCardsLength,
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
                        cardTypeCreditCards,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/card-type-credit-card')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                const cardTypeCreditCards = cloneDeep(this._cardTypeCreditCards);

                const cardTypeCreditCard = cardTypeCreditCards.find((item) => item.id === id);

                // Return the response
                return [200, cardTypeCreditCard];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/card-type-credit-card')
            .reply(() => {
                // Generate a new country 
                const newCardTypeCreditCard = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    name: 'A New Entry',
                    startNumber: '',
                    endNumber: '',
                    cardTypeID: '',
                    modifiedDate: '',
                };

                // Unshift the new country 
                this._cardTypeCreditCards.unshift(newCardTypeCreditCard);

                // Return the response
                return [200, newCardTypeCreditCard];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Country Type - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/card-type-credit-card')
            .reply(({ request }) => {
                // Get the id and country type data
                const id = request.body.id;
                const cardTypeCreditCard = cloneDeep(request.body.cardTypeCreditCard);

                // Prepare the updated country 
                let updatedCardTypeCreditCard = null;

                // Find the country and update it
                this._cardTypeCreditCards.forEach((item, index, cardTypeCreditCards) => {
                    if (item.id === id) {
                        // Update the country 
                        cardTypeCreditCards[index] = assign({},cardTypeCreditCards[index], cardTypeCreditCard);
                        updatedCardTypeCreditCard = cardTypeCreditCards[index];
                    }
                });

                // Return the response
                return [200, updatedCardTypeCreditCard];
            });

        // -----------------------------------------------------------------------------------------------------
        //  DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/card-type-credit-card')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                this._cardTypeCreditCards.forEach((item, index) => {
                    if (item.id === id) {
                        this._cardTypeCreditCards.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
