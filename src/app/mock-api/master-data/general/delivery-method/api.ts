import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { deliveryMethods as deliveryMethodsData } from 'app/mock-api/master-data/general/delivery-method/data'; // Adjust the data import path
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralDeliveryMethodMockApi {
    private _deliveryMethods: any[] = deliveryMethodsData; // Change from countryTypesData to deliveryMethodsData

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
        // @ Delivery Methods - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/delivery-methods', 300) // Change the API path to 'delivery-methods'
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'deliveryMethodName'; // Change sorting to deliveryMethodName
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the delivery methods
                let deliveryMethods: any[] | null = cloneDeep(this._deliveryMethods);

                // Sort the delivery methods
                if (
                    sort === 'deliveryMethodName' ||
                    sort === 'lastEditedBy' ||
                    sort === 'validFrom' ||
                    sort === 'validTo'
                ) {
                    deliveryMethods.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    deliveryMethods.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the delivery methods
                    deliveryMethods = deliveryMethods.filter(
                        (deliveryMethod) =>
                            deliveryMethod.deliveryMethodName &&
                            deliveryMethod.deliveryMethodName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const deliveryMethodsLength = deliveryMethods.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), deliveryMethodsLength);
                const lastPage = Math.max(Math.ceil(deliveryMethodsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                if (page > lastPage) {
                    deliveryMethods = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    deliveryMethods = deliveryMethods.slice(begin, end);
                    pagination = {
                        length: deliveryMethodsLength,
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
                        deliveryMethods, // Return the delivery methods data
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Delivery Method - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/delivery-method') // Adjust endpoint for delivery method
            .reply(({ request }) => {
                const id = request.params.get('id');

                const deliveryMethods = cloneDeep(this._deliveryMethods);

                const deliveryMethod = deliveryMethods.find((item) => item.id === id);

                return [200, deliveryMethod];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Delivery Method - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/delivery-method') // Adjust endpoint for delivery method
            .reply(() => {
                const newDeliveryMethod = {
                    id: FuseMockApiUtils.guid(),
                    deliveryMethodName: 'A New Delivery Method', // Adjust the field names
                    lastEditedBy: 'Admin',
                    validFrom: '',
                    validTo: '',
                };

                this._deliveryMethods.unshift(newDeliveryMethod);

                return [200, newDeliveryMethod];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Delivery Method - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/delivery-method') // Adjust endpoint for delivery method
            .reply(({ request }) => {
                const id = request.body.id;
                const deliveryMethod = cloneDeep(request.body.deliveryMethod);

                let updatedDeliveryMethod = null;

                this._deliveryMethods.forEach((item, index, deliveryMethods) => {
                    if (item.id === id) {
                        deliveryMethods[index] = assign(
                            {},
                            deliveryMethods[index],
                            deliveryMethod
                        );
                        updatedDeliveryMethod = deliveryMethods[index];
                    }
                });

                return [200, updatedDeliveryMethod];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Delivery Method - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/delivery-method') // Adjust endpoint for delivery method
            .reply(({ request }) => {
                const id = request.params.get('id');

                this._deliveryMethods.forEach((item, index) => {
                    if (item.id === id) {
                        this._deliveryMethods.splice(index, 1);
                    }
                });

                return [200, true];
            });
    }
}
