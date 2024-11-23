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
     * Get cardTypes
     *
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
        sort: string = 'cardTypeName',
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
            }>('api/master-data/general/cardTypes', {
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
     * Get cardType by id
     */
    getCardTypeById(id: string): Observable<CardType> {
        return this._cardTypes.pipe(
            take(1),
            map((cardTypes) => {
                // Find the cardType
                const cardType =
                    cardTypes.find((item) => item.id === id) || null;

                // Update the cardType
                this._cardType.next(cardType);

                // Return the cardType
                return cardType;
            }),
            switchMap((cardType) => {
                if (!cardType) {
                    return throwError(
                        'Could not found cardType with id of ' + id + '!'
                    );
                }

                return of(cardType);
            })
        );
    }

    /**
     * Create cardType
     */
    createCardType(): Observable<CardType> {
        return this.cardTypes$.pipe(
            take(1),
            switchMap((cardTypes) =>
                this._httpClient
                    .post<CardType>('api/master-data/general/cardType', {})
                    .pipe(
                        map((newCardType) => {
                            // Update the cardTypes with the new cardType
                            this._cardTypes.next([newCardType, ...cardTypes]);

                            // Return the new cardType
                            return newCardType;
                        })
                    )
            )
        );
    }

    /**
     * Update cardType
     *
     * @param id
     * @param cardType
     */
    updateCardType(id: string, cardType: CardType): Observable<CardType> {
        return this.cardTypes$.pipe(
            take(1),
            switchMap((cardTypes) =>
                this._httpClient
                    .patch<CardType>('api/master-data/general/cardType', {
                        id,
                        cardType,
                    })
                    .pipe(
                        map((updatedCardType) => {
                            // Find the index of the updated cardType
                            const index = cardTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the cardType
                            cardTypes[index] = updatedCardType;

                            // Update the cardTypes
                            this._cardTypes.next(cardTypes);

                            // Return the updated cardType
                            return updatedCardType;
                        }),
                        switchMap((updatedCardType) =>
                            this.cardType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the cardType if it's selected
                                    this._cardType.next(updatedCardType);

                                    // Return the updated cardType
                                    return updatedCardType;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the cardType
     *
     * @param id
     */
    deleteCardType(id: string): Observable<boolean> {
        return this.cardTypes$.pipe(
            take(1),
            switchMap((cardTypes) =>
                this._httpClient
                    .delete('api/master-data/general/cardType', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted cardType
                            const index = cardTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the cardType
                            cardTypes.splice(index, 1);

                            // Update the cardTypes
                            this._cardTypes.next(cardTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
