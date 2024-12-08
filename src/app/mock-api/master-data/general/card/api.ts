import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { cards as cardsData } from 'app/mock-api/master-data/general/card/data'; 
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCardMockApi {
    private _cards: any[] = cardsData; 

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Cards - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/cards', 300) 
            .reply(({ request }) => {
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'cardNumber'; 
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                let cards: any[] | null = cloneDeep(this._cards);

                if (
                    sort === 'cardNumber' ||
                    sort === 'cardTypeID' ||
                    sort === 'modifiedDate' 
                ) {
                    cards.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    cards.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                if (search) {
                    cards = cards.filter(
                        (card) =>
                            card.cardNumber &&
                            card.cardNumber.toLowerCase().includes(search.toLowerCase())
                    );
                }

                const cardsLength = cards.length;
                const begin = page * size;
                const end = Math.min(size * (page + 1), cardsLength);
                const lastPage = Math.max(Math.ceil(cardsLength / size), 1);

                let pagination = {};
                if (page > lastPage) {
                    cards = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    cards = cards.slice(begin, end);
                    pagination = {
                        length: cardsLength,
                        size: size,
                        page: page,
                        lastPage: lastPage,
                        startIndex: begin,
                        endIndex: end - 1,
                    };
                }

                return [
                    200,
                    {
                        cards, 
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
        .onGet('api/master-data/general/card')
        .reply(({ request }) => {
            const id = request.params.get('id');
            const cards = cloneDeep(this._cards);
            const card = cards.find((item) => item.id === id);
            return [200, card];
        });
    
    

        // -----------------------------------------------------------------------------------------------------
        // @ Card - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/card') 
            .reply(() => {
                const newCard = {
                    id: FuseMockApiUtils.guid(),
                    cardNumber: 'A New Card', 
                    cardTypeID: 'Admin',
                    modifiedDate: '',
                };
                this._cards.unshift(newCard);
                return [200, newCard];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/card') 
            .reply(({ request }) => {
                const id = request.body.id;
                const card = cloneDeep(request.body.card);
                let updatedCard = null;
                this._cards.forEach((item, index, cards) => {
                    if (item.id === id) {
                        cards[index] = assign({}, cards[index], card);
                        updatedCard = cards[index];
                    }
                });
                return [200, updatedCard];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Card - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/card') 
            .reply(({ request }) => {
                const id = request.params.get('id');
                this._cards.forEach((item, index) => {
                    if (item.id === id) {
                        this._cards.splice(index, 1);
                    }
                });
                return [200, true];
            });
    }
}
