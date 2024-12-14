import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { currencies as currenciesData } from 'app/mock-api/master-data/general/currency/data';
import { assign, cloneDeep } from 'lodash-es';
@Injectable({ providedIn: 'root' })
export class GeneralCurrencyMockApi {
    private _currencies: any[] = currenciesData;
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
        // @ Currencies - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/currencies', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'currencyName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);
                // Clone the currencies
                let currencies: any[] | null = cloneDeep(this._currencies);
                // Sort the currencies
                if (
                    sort === 'currencyName' ||
                    sort === 'modifiedDate' 
                ) {
                    currencies.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    currencies.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }
                // If search exists...
                if (search) {
                    // Filter the currencies
                    currencies = currencies.filter(
                        (currency) =>
                            currency.currencyName &&
                            currency.currencyName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }
                // Paginate - Start
                const currenciesLength = currencies.length;
                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), currenciesLength);
                const lastPage = Math.max(Math.ceil(currenciesLength / size), 1);
                // Prepare the pagination object
                let pagination = {};
                // If the requested page number is bigger than
                // the last possible page number, return null for
                // country types but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    currencies = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    currencies = currencies.slice(begin, end);
                    // Prepare the pagination mock-api
                    pagination = {
                        length: currenciesLength,
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
                        currencies,
                        pagination,
                    },
                ];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ Currency - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/currency')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');
                // Clone the currency
                const currencies = cloneDeep(this._currencies);
                // Find the currency
                const currency = currencies.find((item) => item.id === id);
                // Return the response
                return [200, currency];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ Currency - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/currency')
            .reply(() => {
                // Generate a new currency
                const newCurrency = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    currencyName: 'A New Currency',
                    modifiedDate: '',
                };
                // Unshift the new currency
                this._currencies.unshift(newCurrency);
                // Return the response
                return [200, newCurrency];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ Currency - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/currency')
            .reply(({ request }) => {
                // Get the id and currency data
                const id = request.body.id;
                const currency = cloneDeep(request.body.currency);
                // Prepare the updated currency
                let updatedCurrency = null;
                // Find the currency and update it
                this._currencies.forEach((item, index, currencies) => {
                    if (item.id === id) {
                        // Update the currency
                        currencies[index] = assign(
                            {},
                            currencies[index],
                            currency
                        );
                        // Store the updated currency
                        updatedCurrency = currencies[index];
                    }
                });
                // Return the response
                return [200, updatedCurrency];
            });
        // -----------------------------------------------------------------------------------------------------
        // @ Currency - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/currency')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');
                // Find the currency and delete it
                this._currencies.forEach((item, index) => {
                    if (item.id === id) {
                        this._currencies.splice(index, 1);
                    }
                });
                // Return the response
                return [200, true];
            });
    }
}



