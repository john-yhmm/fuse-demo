import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { 
    CardTypeCreditCard, 
    CardTypeCreditCardPagination, 
} from 'app/modules/admin/master-data/general/card-type-credit-card/card-type-credit-card.types';
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
export class CardTypeCreditCardService {
    // Private
    private _pagination: BehaviorSubject<CardTypeCreditCardPagination | null> =
        new BehaviorSubject(null);
    private _cardTypeCreditCard: BehaviorSubject<CardTypeCreditCard| null> = new BehaviorSubject(null);
    private _cardTypeCreditCards: BehaviorSubject<CardTypeCreditCard[] | null> = new BehaviorSubject(null);

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
    get pagination$(): Observable<CardTypeCreditCardPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for cardtypecreditcard
     */
    get cardTypeCreditCard$(): Observable<CardTypeCreditCard> {
        return this._cardTypeCreditCard.asObservable();
    }

    /**
     * Getter for cardtypecreditcards
     */
    get cardTypeCreditCards$(): Observable<CardTypeCreditCard[]> {
        return this._cardTypeCreditCards.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCardTypeCreditCards(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CardTypeCreditCardPagination;
        cardTypeCreditCards: CardTypeCreditCard[];
    }> {
        return this._httpClient
            .get<{
                pagination: CardTypeCreditCardPagination;
                cardTypeCreditCards: CardTypeCreditCard[];
            }>('api/master-data/general/card-type-credit-cards', {
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
                    this._cardTypeCreditCards.next(response.cardTypeCreditCards);
                })
            );
    }

    /**
     * Get card type credit card by id
     */
    getCardTypeCreditCardById(id: string): Observable<CardTypeCreditCard> {
        return this._cardTypeCreditCards.pipe(
            take(1),
            map((cardTypeCreditCards) => {

                const cardTypeCreditCard =
                cardTypeCreditCards.find((item) => item.id === id) || null;

                // Update 
                this._cardTypeCreditCard.next(cardTypeCreditCard);

                // Return 
                return cardTypeCreditCard;
            }),
            switchMap((cardTypeCreditCard) => {
                if (!cardTypeCreditCard) {
                    return throwError(
                        'Could not found card type credit card with id of ' + id + '!'
                    );
                }

                return of(cardTypeCreditCard);
            })
        );
    }

    /**
     * Create 
     */
    createCardTypeCreditCard(): Observable<CardTypeCreditCard> {
        return this._httpClient
            .post<CardTypeCreditCard>('api/master-data/general/card-type-credit-card', {})
            .pipe(
                tap((newCardTypeCreditCard) => {
                    // Ensure newCountry.id is defined
                    if (!newCardTypeCreditCard.id) {
                        console.error('Newly created card type credit card lacks an ID');
                        return;
                    }
                    const currentCardTypeCreditCards = this._cardTypeCreditCards.getValue();
                    this._cardTypeCreditCards.next([newCardTypeCreditCard, ...currentCardTypeCreditCards]);
                })
            );
    }
    
    /**
     * Update card type credit card
     *
     * @param id
     * @param cardTypeCreditCard
     */
    updateCardTypeCreditCard(id: string, cardTypeCreditCard: CardTypeCreditCard): Observable<CardTypeCreditCard> {
        console.log('Sending PATCH request:', { id, cardTypeCreditCard });
      
        return this._httpClient
            .patch<CardTypeCreditCard>('api/master-data/general/card-type-credit-card', { id, cardTypeCreditCard}
            ).pipe(
                tap((updatedCardTypeCreditCard) => {
                    console.log('PATCH response received:', updatedCardTypeCreditCard);
            
                    // Update the _cardTypeCreditCards BehaviorSubject with the updated cardTypeCreditCard type
                    const currentCardTypeCreditCards = this._cardTypeCreditCards.getValue(); // Get the currentcardTypeCreditCard types
                    const index = currentCardTypeCreditCards.findIndex((ct) => ct.id === id); // Find the index of the updated cardTypeCreditCard
            
                    if (index !== -1) {
                        currentCardTypeCreditCards[index] = updatedCardTypeCreditCard; // Update the country type in the list
                        this._cardTypeCreditCards.next(currentCardTypeCreditCards); // Emit the updated list
                    }
                })
            );
        }
      
    /**
     * Delete the cardTypeCreditCard
     *
     * @param id
     */
    deleteCardTypeCreditCard(id: string): Observable<boolean> {
        console.log('Attempting to delete card type credit card with ID:', id);
        return this.cardTypeCreditCards$.pipe(
            take(1),
            switchMap((cardTypeCreditCards) =>
                this._httpClient
                    .delete('api/master-data/general/card-type-credit-card', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted cardTypeCreditCard type
                            const index = cardTypeCreditCards.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the card type credit card
                            cardTypeCreditCards.splice(index, 1);

                            // Update the card type credit card
                            this._cardTypeCreditCards.next(cardTypeCreditCards);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}