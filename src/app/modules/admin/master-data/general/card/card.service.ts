import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    Card,
    CardPagination,
} from 'app/modules/admin/master-data/general/card/card.types';
import {
    BehaviorSubject,
    Observable,
    filter,
    map,
    of,
    switchMap,
    take,
    tap,
    throwError,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CardService {
    // Private
    private _pagination: BehaviorSubject<CardPagination | null> =
        new BehaviorSubject(null);
    private _card: BehaviorSubject<Card | null> = new BehaviorSubject(null);
    private _cards: BehaviorSubject<Card[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------
    /**
     * Getter for pagination
     */
    get pagination$(): Observable<CardPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for card
     */
    get card$(): Observable<Card> {
        return this._card.asObservable();
    }

    /**
     * Getter for cards
     */
    get cards$(): Observable<Card[]> {
        return this._cards.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * Get cards
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCards(
        page: number = 0,
        size: number = 10,
        sort: string = 'cardNumber',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CardPagination;
        cards: Card[];
    }> {
        return this._httpClient
            .get<{
                pagination: CardPagination;
                cards: Card[];
            }>('api/master-data/general/cards', {
                params: {
                    page: '' + page,
                    size: '' + size,
                    sort,
                    order,
                    search,
                },
            })
            .pipe(
                tap((response) => {
                    this._pagination.next(response.pagination);
                    this._cards.next(response.cards);
                })
            );
    }
    

    /**
     * Get card by id
     */
    getCardById(id: string): Observable<Card> {
        return this._cards.pipe(
            take(1),
            map((cards) => {
                const card = cards.find((item) => item.id === id) || null;
                this._card.next(card);
                return card;
            }),
            switchMap((card) => {
                if (!card) {
                    return throwError('Could not find card with id of ' + id + '!');
                }
                return of(card);
            })
        );
    }

    /**
     * Create card
     */
    createCard(): Observable<Card> {
        return this._httpClient
            .post<Card>('api/master-data/general/card', {})
            .pipe(
                tap((newCard) => {
                    if (!newCard.id) {
                        console.error('Newly created card lacks an ID');
                        return;
                    }
                    const currentCards = this._cards.getValue();
                    this._cards.next([newCard, ...currentCards]);
                })
            );
    }

    /**
     * Update card
     *
     * @param id
     * @param card
     */
    updateCard(id: string, card: Card): Observable<Card> {
        console.log('Sending PATCH request:', { id, card });

        return this._httpClient
            .patch<Card>('api/master-data/general/card', { id, card })
            .pipe(
                tap((updatedCard) => {
                    console.log('PATCH response received:', updatedCard);

                    const currentCards = this._cards.getValue();
                    const index = currentCards.findIndex((c) => c.id === id);

                    if (index !== -1) {
                        currentCards[index] = updatedCard;
                        this._cards.next(currentCards);
                    }
                })
            );
    }

    /**
     * Delete the card
     *
     * @param id
     */
    deleteCard(id: string): Observable<boolean> {
        console.log('Attempting to delete card with ID:', id);
        return this.cards$.pipe(
            take(1),
            switchMap((cards) =>
                this._httpClient
                    .delete('api/master-data/general/card', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            const index = cards.findIndex((item) => item.id === id);
                            cards.splice(index, 1);
                            this._cards.next(cards);
                            return isDeleted;
                        })
                    )
            )
        );
    }
    
}