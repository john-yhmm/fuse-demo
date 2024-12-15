import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { currencyRates as currencyRatesData } from 'app/mock-api/master-data/general/currency-rate/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralCurrencyRateMockApi {
    private _currencyRates: any[] = currencyRatesData;

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
        // @ Currency Rate - GET (List)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/currency-rates', 300)
            .reply(({ request }) => {
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'currencyRateDate';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                let currencyRates: any[] | null = cloneDeep(this._currencyRates);

                if (
                    sort === 'currencyRateDate' ||
                    sort === 'fromCurrencyID' ||
                    sort === 'toCurrencyID' ||
                    sort === 'averageRate' ||
                    sort === 'endOfDayRate' ||
                    sort === 'modifiedDate'
                ) {
                    currencyRates.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    currencyRates.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                if (search) {
                    currencyRates = currencyRates.filter(
                        (currencyRate) =>
                            currencyRate.fromCurrencyID &&
                            currencyRate.fromCurrencyID
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                const currencyRatesLength = currencyRates.length;
                const begin = page * size;
                const end = Math.min(size * (page + 1), currencyRatesLength);
                const lastPage = Math.max(Math.ceil(currencyRatesLength / size), 1);

                let pagination = {};
                if (page > lastPage) {
                    currencyRates = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    currencyRates = currencyRates.slice(begin, end);
                    pagination = {
                        length: currencyRatesLength,
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
                        currencyRates,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Currency Rate - GET (Single)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/currency-rate')
            .reply(({ request }) => {
                const id = request.params.get('id');
                const currencyRates = cloneDeep(this._currencyRates);
                const currencyRate = currencyRates.find((item) => item.id === id);
                return [200, currencyRate];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Currency Rate - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/currency-rate')
            .reply(() => {
                const newCurrencyRate = {
                    id: FuseMockApiUtils.guid(),
                    currencyRateDate: '',
                    fromCurrencyID: '',
                    toCurrencyID: '',
                    averageRate: 0,
                    endOfDayRate: 0,
                    modifiedDate: '',
                };

                this._currencyRates.unshift(newCurrencyRate);
                return [200, newCurrencyRate];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Currency Rate - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/currency-rate')
            .reply(({ request }) => {
                const id = request.body.id;
                const currencyRate = cloneDeep(request.body.currencyRate);

                let updatedCurrencyRate = null;
                this._currencyRates.forEach((item, index, currencyRates) => {
                    if (item.id === id) {
                        currencyRates[index] = assign(
                            {},
                            currencyRates[index],
                            currencyRate
                        );
                        updatedCurrencyRate = currencyRates[index];
                    }
                });

                return [200, updatedCurrencyRate];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Currency Rate - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/currency-rate')
            .reply(({ request }) => {
                const id = request.params.get('id');
                this._currencyRates.forEach((item, index) => {
                    if (item.id === id) {
                        this._currencyRates.splice(index, 1);
                    }
                });
                return [200, true];
            });
    }
}