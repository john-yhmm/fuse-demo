import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    CreditCardType,
    CreditCardTypePagination,
} from 'app/modules/admin/master-data/general/credit-card-type/credit-card-type.types';
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
export class CreditCardTypeService {
    // Private
    private _pagination: BehaviorSubject<CreditCardTypePagination | null> =
        new BehaviorSubject(null);
    private _creditcardtype: BehaviorSubject<CreditCardType | null> = new BehaviorSubject(
        null
    );
    private _creditcardtypes: BehaviorSubject<CreditCardType[] | null> =
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
    get pagination$(): Observable<CreditCardTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for language
     */
    get creditcardtype$(): Observable<CreditCardType> {
        return this._creditcardtype.asObservable();
    }

    /**
     * Getter for languages
     */
    get creditcardtypes$(): Observable<CreditCardType[]> {
        return this._creditcardtypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get creditcardtypes
     *
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCreditCardTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CreditCardTypePagination;
        creditcardtypes: CreditCardType[];
    }> {
        return this._httpClient
            .get<{
                pagination: CreditCardTypePagination;
                creditcardtypes: CreditCardType[];
            }>('api/master-data/general/credit-card-types', {
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
                    this._creditcardtypes.next(response.creditcardtypes);
                })
            );
    }

    /**
     * Get language by id
     */
    getCreditCardTypeById(id: string): Observable<CreditCardType> {
        return this._creditcardtypes.pipe(
            take(1),
            map((creditcardtypes) => {
                // Find the language
                const creditcardtype =
                    creditcardtypes.find((item) => item.id === id) || null;

                // Update the language
                this._creditcardtype.next(creditcardtype);

                // Return the language
                return creditcardtype;
            }),
            switchMap((creditcardtype) => {
                if (!creditcardtype) {
                    return throwError(
                        'Could not found creditcardtype with id of ' + id + '!'
                    );
                }

                return of(creditcardtype);
            })
        );
    }

    /**
     * Create language
     */
    createCreditCardType(): Observable<CreditCardType> {
        return this.creditcardtypes$.pipe(
            take(1),
            switchMap((creditcardtypes) =>
                this._httpClient
                    .post<CreditCardType>('api/master-data/general/credit-card-type', {})
                    .pipe(
                        map((newCreditCardType) => {
                            // Update the languages with the new language
                            this._creditcardtypes.next([newCreditCardType, ...creditcardtypes]);

                            // Return the new language
                            return newCreditCardType;
                        })
                    )
            )
        );
    }

    /**
     * Update creditcardtype
     *
     * @param id
     * @param creditcardtype
     */
    updateCreditCardType(id: string, creditcardtype: CreditCardType): Observable<CreditCardType> {
        return this.creditcardtypes$.pipe(
            take(1),
            switchMap((creditcardtypes) =>
                this._httpClient
                    .patch<CreditCardType>('api/master-data/general/credit-card-type', {
                        id,
                        creditcardtype,
                    })
                    .pipe(
                        map((updatedCreditCardType) => {
                            // Find the index of the updated creditcardtye
                            const index = creditcardtypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the language
                            creditcardtypes[index] = updatedCreditCardType;
                            console.log(updatedCreditCardType);

                            // Update the languages
                            this._creditcardtypes.next(creditcardtypes);

                            // Return the updated language
                            return updatedCreditCardType;
                        }),
                        switchMap((updatedCreditCardType) =>
                            this.creditcardtype$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the language if it's selected
                                    this._creditcardtype.next(updatedCreditCardType);

                                    // Return the updated language
                                    return updatedCreditCardType;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the language
     *
     * @param id
     */
    deleteCreditCardType(id: string): Observable<boolean> {
        return this.creditcardtypes$.pipe(
            take(1),
            switchMap((creditcardtypes) =>
                this._httpClient
                    .delete('api/master-data/general/credit-card-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted creditcardtype
                            const index = creditcardtypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the creditcardtype
                            creditcardtypes.splice(index, 1);

                            // Update the creditcardtypes
                            this._creditcardtypes.next(creditcardtypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
