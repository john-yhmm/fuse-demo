import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    CurrencyRate,
    CurrencyRatePagination,
} from 'app/modules/admin/master-data/general/currency-rate/currency-rate.types';
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
export class CurrencyRateService {
    // Private
    private _pagination: BehaviorSubject<CurrencyRatePagination | null> =
        new BehaviorSubject(null);
    private _currencyRate: BehaviorSubject<CurrencyRate | null> = new BehaviorSubject(null);
    private _currencyRates: BehaviorSubject<CurrencyRate[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) {}

    // Getters
    get pagination$(): Observable<CurrencyRatePagination> {
        return this._pagination.asObservable();
    }

    get currencyRate$(): Observable<CurrencyRate> {
        return this._currencyRate.asObservable();
    }

    get currencyRates$(): Observable<CurrencyRate[]> {
        return this._currencyRates.asObservable();
    }

    // Fetch all currency rates with pagination and search
    getCurrencyRates(
        page: number = 0,
        size: number = 10,
        sort: string = 'currencyRateDate',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{ 
        pagination: CurrencyRatePagination; 
        currencyRates: CurrencyRate[] }> {
        return this._httpClient
            .get<{ pagination: CurrencyRatePagination; currencyRates: CurrencyRate[] }>(
                'api/master-data/general/currency-rates',
                {
                    params: {
                        page: '' + page,
                        size: '' + size,
                        sort,
                        order,
                        search,
                    },
                }
            )
            .pipe(
                tap((response) => {
                    this._pagination.next(response.pagination);
                    this._currencyRates.next(response.currencyRates);
                })
            );
    }

    // Fetch a specific currency rate by ID
    getCurrencyRateById(id: string): Observable<CurrencyRate> {
        return this._currencyRates.pipe(
            take(1),
            map((currencyRates) => {
                const currencyRate = currencyRates.find((item) => item.id === id) || null;
                this._currencyRate.next(currencyRate);
                return currencyRate;
            }),
            switchMap((currencyRate) => {
                if (!currencyRate) {
                    return throwError(
                        'Could not find a currency rate with the ID: ' + id
                    );
                }
                return of(currencyRate);
            })
        );
    }

    // Create a new currency rate
    createCurrencyRate(): Observable<CurrencyRate> {
        return this._httpClient
            .post<CurrencyRate>('api/master-data/general/currency-rate', {})
            .pipe(
                tap((newCurrencyRate) => {                    
                    if (!newCurrencyRate.id) {
                    console.error('Newly created currency rate lacks an ID');
                    return;
                }

                    const currentCurrencyRates = this._currencyRates.getValue() || [];
                    this._currencyRates.next([newCurrencyRate, ...currentCurrencyRates]);
                })
            );
    }

    // Update an existing currency rate
    updateCurrencyRate(id: string, currencyRate: CurrencyRate): Observable<CurrencyRate> {
        return this._httpClient
            .patch<CurrencyRate>('api/master-data/general/currency-rate', { id, currencyRate })
            .pipe(
                tap((updatedCurrencyRate) => {
                    const currentCurrencyRates = this._currencyRates.getValue() || [];
                    const index = currentCurrencyRates.findIndex((cr) => cr.id === id);

                    if (index !== -1) {
                        currentCurrencyRates[index] = updatedCurrencyRate;
                        this._currencyRates.next(currentCurrencyRates);
                    }
                })
            );
    }

    // Delete a currency rate
    deleteCurrencyRate(id: string): Observable<boolean> {
        return this.currencyRates$.pipe(
            take(1),
            switchMap((currencyRates) =>
                this._httpClient
                    .delete<boolean>('api/master-data/general/currency-rate', { params: { id } })
                    .pipe(
                        map((isDeleted: boolean) => {
                            const index = currencyRates.findIndex((item) => item.id === id);
                            // Delete the currency rates
                            currencyRates.splice(index, 1);

                            // Update the currency rates
                            this._currencyRates.next(currencyRates);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
