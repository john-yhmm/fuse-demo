import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { paymentMethods as paymentMethodsData } from 'app/mock-api/master-data/general/payment-method/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralPaymentMethodMockApi {
    private _paymentMethods: any[] = paymentMethodsData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
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
        // @ paymentMethods - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/payment-methods', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'paymentMethodName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the paymentMethods
                let paymentMethods: any[] | null = cloneDeep(this._paymentMethods);

                // Sort the paymentMethods
                if (
                    sort === 'paymentMethodName' ||
                    sort === 'rowguid' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    paymentMethods.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    paymentMethods.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the paymentMethods
                    paymentMethods = paymentMethods.filter(
                        (paymentMethod) =>
                            paymentMethod.paymentMethodName &&
                            paymentMethod.paymentMethodName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const paymentMethodsLength = paymentMethods.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), paymentMethodsLength);
                const lastPage = Math.max(Math.ceil(paymentMethodsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // paymentMethods but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    paymentMethods = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    paymentMethods = paymentMethods.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length: paymentMethodsLength,
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
                        paymentMethods,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ paymentMethod - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/payment-method')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');

                // Clone the paymentMethods
                const paymentMethods = cloneDeep(this._paymentMethods);

                // Find the paymentMethod
                const paymentMethod = paymentMethods.find((item) => item.id === id);

                // Return the response
                return [200, paymentMethod];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ paymentMethod - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/payment-method')
            .reply(() => {
                // Generate a new paymentMethod
                const newPaymentMethod = {
                    id: FuseMockApiUtils.guid(),
                    paymentMethodName: 'A New Payment Method',
                    rowguid: '',
                    lastEditedBy: '',
                    lastEditedOn: '',
                };

                // Unshift the new paymentMethod
                this._paymentMethods.unshift(newPaymentMethod);

                // Return the response
                return [200, newPaymentMethod];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ paymentMethod - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/payment-method')
            .reply(({ request }) => {
                // Get the id and paymentMethod
                const id = request.body.id;
                const paymentMethod = cloneDeep(request.body.paymentMethod);

                // Prepare the updated paymentMethod
                let updatedPaymentMethod = null;

                // Find the paymentMethod and update it
                this._paymentMethods.forEach((item, index, paymentMethods) => {
                    if (item.id === id) {
                        // Update the paymentMethod
                        paymentMethods[index] = assign(
                            {},
                            paymentMethods[index],
                            paymentMethod
                        );

                        // Store the updated paymentMethod
                        updatedPaymentMethod = paymentMethods[index];
                    }
                });

                // Return the response
                return [200, updatedPaymentMethod];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ paymentMethod - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/payment-method')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');

                // Find the paymentMethod and delete it
                this._paymentMethods.forEach((item, index) => {
                    if (item.id === id) {
                        this._paymentMethods.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });
    }
}
