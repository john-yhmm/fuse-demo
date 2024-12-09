import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    CardType,
    CardTypePagination,
} from 'app/modules/admin/master-data/general/card-type/card-type.types';
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
export class CardTypeService {
    // Private
    private _pagination: BehaviorSubject<CardTypePagination | null> =
        new BehaviorSubject(null);
    private _cardType: BehaviorSubject<CardType | null> = new BehaviorSubject(
        null
    );
    private _cardTypes: BehaviorSubject<CardType[] | null> =
        new BehaviorSubject(null);
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
    get pagination$(): Observable<CardTypePagination> {
        return this._pagination.asObservable();
    }
    /**
     * Getter for cardType
     */
    get cardType$(): Observable<CardType> {
        return this._cardType.asObservable();
    }
    /**
     * Getter for cardTypes
     */
    get cardTypes$(): Observable<CardType[]> {
        return this._cardTypes.asObservable();
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * Get card types
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCardTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CardTypePagination;
        cardTypes: CardType[];
    }> {
        return this._httpClient
            .get<{
                pagination: CardTypePagination;
                cardTypes: CardType[];
            }>('api/master-data/general/card-types', {
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
                    this._cardTypes.next(response.cardTypes);
                })
            );
    }
    /**
     * Get card type by id
     */
    getCardTypeById(id: string): Observable<CardType> {
        return this._cardTypes.pipe(
            take(1),
            map((cardTypes) => {
                // Find the card type
                const cardType =
                    cardTypes.find((item) => item.id === id) || null;
                // Update the card type
                this._cardType.next(cardType);
                // Return the card type
                return cardType;
            }),
            switchMap((cardType) => {
                if (!cardType) {
                    return throwError(
                        'Could not found card type with id of ' + id + '!'
                    );
                }
                return of(cardType);
            })
        );
    }
    /**
     * Create card type
     */
    createCardType(): Observable<CardType> {
        return this._httpClient
            .post<CardType>('api/master-data/general/card-type', {})
            .pipe(
                tap((newCardType) => {
                    // Ensure newCardType.id is defined
                    if (!newCardType.id) {
                        console.error('Newly created card type lacks an ID');
                        return;
                    }
                    const currentCardTypes = this._cardTypes.getValue();
                    this._cardTypes.next([newCardType, ...currentCardTypes]);
                })
            );
    }
    /**
     * Update card type
     *
     * @param id
     * @param cardType
     */
    updateCardType(id: string, cardType: CardType): Observable<CardType> {
        console.log('Sending PATCH request:', { id, cardType });
        return this._httpClient.patch<CardType>(
          'api/master-data/general/card-type',
          { id, cardType }
        ).pipe(
          tap((updatedCardType) => {
            console.log('PATCH response received:', updatedCardType);
            // Update the _cardTypes BehaviorSubject with the updated card type
            const currentCardTypes = this._cardTypes.getValue(); // Get the current card types
            const index = currentCardTypes.findIndex((ct) => ct.id === id); // Find the index of the updated card type
            if (index !== -1) {
              currentCardTypes[index] = updatedCardType; // Update the card type in the list
              this._cardTypes.next(currentCardTypes); // Emit the updated list
            }
          })
        );
      }
    /**
     * Delete the card type
     *
     * @param id
     */
    deleteCardType(id: string): Observable<boolean> {
        console.log('Attempting to delete card type with ID:', id);
        return this.cardTypes$.pipe(
            take(1),
            switchMap((cardTypes) =>
                this._httpClient
                    .delete('api/master-data/general/card-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted card type
                            const index = cardTypes.findIndex(
                                (item) => item.id === id
                            );
                            // Delete the card type
                            cardTypes.splice(index, 1);
                            // Update the card types
                            this._cardTypes.next(cardTypes);
                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}