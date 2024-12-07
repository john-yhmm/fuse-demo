import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { paymentAvenues as paymentAvenuesData } from 'app/mock-api/master-data/general/paymentAvenue/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class PaymentAvenueMockApi {
    private _paymentAvenues: any[] = paymentAvenuesData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenues - GET (List with pagination, search, and sort)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/payment-avenues', 300)
            .reply(({ request }) => {
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the data
                let paymentAvenues: any[] | null = cloneDeep(this._paymentAvenues);

                // Sort
                if (sort === 'name' || sort === 'modifiedDate') {
                    paymentAvenues.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                }

                // Search
                if (search) {
                    paymentAvenues = paymentAvenues.filter((item) =>
                        item.name.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Pagination
                const paymentAvenuesLength = paymentAvenues.length;
                const begin = page * size;
                const end = Math.min(size * (page + 1), paymentAvenuesLength);
                const lastPage = Math.max(Math.ceil(paymentAvenuesLength / size), 1);

                let pagination = {};
                if (page > lastPage) {
                    paymentAvenues = null;
                    pagination = { lastPage };
                } else {
                    paymentAvenues = paymentAvenues.slice(begin, end);
                    pagination = {
                        length: paymentAvenuesLength,
                        size: size,
                        page: page,
                        lastPage: lastPage,
                        startIndex: begin,
                        endIndex: end - 1,
                    };
                }

                return [200, { paymentAvenues, pagination }];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - GET (Single)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/payment-avenue')
            .reply(({ request }) => {
                const id = request.params.get('id');
                const paymentAvenues = cloneDeep(this._paymentAvenues);
                const paymentAvenue = paymentAvenues.find((item) => item.id === id);
                return [200, paymentAvenue];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - POST (Create)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/payment-avenue')
            .reply(() => {
                const newPaymentAvenue = {
                    id: FuseMockApiUtils.guid(),
                    name: 'New Payment Avenue',
                    modifiedDate: '',
                };
                this._paymentAvenues.unshift(newPaymentAvenue);
                return [200, newPaymentAvenue];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - PATCH (Update)
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/payment-avenue')
            .reply(({ request }) => {
                const id = request.body.id;
                const paymentAvenue = cloneDeep(request.body.paymentAvenue);

                let updatedPaymentAvenue = null;
                this._paymentAvenues.forEach((item, index, paymentAvenues) => {
                    if (item.id === id) {
                        paymentAvenues[index] = assign({}, paymentAvenues[index], paymentAvenue);
                        updatedPaymentAvenue = paymentAvenues[index];
                    }
                });

                return [200, updatedPaymentAvenue];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Payment Avenue - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/payment-avenue')
            .reply(({ request }) => {
                const id = request.params.get('id');
                this._paymentAvenues.forEach((item, index) => {
                    if (item.id === id) {
                        this._paymentAvenues.splice(index, 1);
                    }
                });
                return [200, true];
            });
    }
}