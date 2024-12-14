import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    Currency,
    CurrencyPagination,
} from 'app/modules/admin/master-data/general/currency/currency.types';
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
export class CurrencyService {
    // Private
    private _pagination: BehaviorSubject<CurrencyPagination | null> =
        new BehaviorSubject(null);
    private _currency: BehaviorSubject<Currency | null> = new BehaviorSubject(
        null
    );
    private _currencies: BehaviorSubject<Currency[] | null> =
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
    get pagination$(): Observable<CurrencyPagination> {
        return this._pagination.asObservable();
    }
    /**
     * Getter for currency
     */
    get currency$(): Observable<Currency> {
        return this._currency.asObservable();
    }
    /**
     * Getter for currencies
     */
    get currencies$(): Observable<Currency[]> {
        return this._currencies.asObservable();
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * Get currencies
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCurrencies(
        page: number = 0,
        size: number = 10,
        sort: string = 'currencyName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: CurrencyPagination;
        currencies: Currency[];
    }> {
        return this._httpClient
            .get<{
                pagination: CurrencyPagination;
                currencies: Currency[];
            }>('api/master-data/general/currencies', {
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
                    this._currencies.next(response.currencies);
                })
            );
    }
    /**
     * Get currency by id
     */
    getCurrencyById(id: string): Observable<Currency> {
        return this._currencies.pipe(
            take(1),
            map((currencies) => {
                // Find the currency
                const currency =
                currencies.find((item) => item.id === id) || null;
                // Update the currency
                this._currency.next(currency);
                // Return the currency
                return currency;
            }),
            switchMap((currency) => {
                if (!currency) {
                    return throwError(
                        'Could not found currency type with id of ' + id + '!'
                    );
                }
                return of(currency);
            })
        );
    }
    /**
     * Create currency
     */
    createCurrency(): Observable<Currency> {
        return this.currencies$.pipe(
            take(1),
            switchMap((currencies) =>
                this._httpClient
                    .post<Currency>('api/master-data/general/currency', {})
                    .pipe(
                        map((newCurrency) => {
                            // Ensure no unintended default values
                            newCurrency = {
                                id: null,
                                currencyCode: 'New currency code',
                                currencyName: 'New currency name',
                                symbol: 'New currency symbol',
                                modifiedDate: '',
                                ...newCurrency
                            };

                            // Update the currencies with the sanitized new currency
                            this._currencies.next([newCurrency, ...currencies]);

                            // Return the sanitized new currency
                            return newCurrency;
                        })
                    )
            )
        );
    }

    /**
     * Update currency
     *
     * @param id
     * @param currency
     */
    updateCurrencyType(id: string, currency: Currency): Observable<Currency> {
        return this.currencies$.pipe(
            take(1),
            switchMap((currencies) =>
                this._httpClient
                    .patch<Currency>('api/master-data/general/currency', {
                        id,
                        currency,
                    })
                    .pipe(
                        map((updatedCurrency) => {
                            // Find the index of the updated currency
                            const index = currencies.findIndex(
                                (item) => item.id === id
                            );
                            // Update the currency
                            currencies[index] = updatedCurrency;
                            // Update the currencies
                            this._currencies.next(currencies);
                            // Return the updated currency
                            return updatedCurrency;
                        }),
                        switchMap((updatedCurrency) =>
                            this.currency$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the currency if it's selected
                                    this._currency.next(updatedCurrency);
                                    // Return the updated currency
                                    return updatedCurrency;
                                })
                            )
                        )
                    )
            )
        );
    }
    /**
     * Delete the currency
     *
     * @param id
     */
    deleteCurrency(id: string): Observable<boolean> {
        return this.currencies$.pipe(
            take(1),
            switchMap((currencies) =>
                this._httpClient
                    .delete('api/master-data/general/currency', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted currency
                            const index = currencies.findIndex(
                                (item) => item.id === id
                            );
                            // Delete the currency
                            currencies.splice(index, 1);
                            // Update the currencies
                            this._currencies.next(currencies);
                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}



