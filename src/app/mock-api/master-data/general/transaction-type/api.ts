import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { transactionTypes as transactionTypesData } from 'app/mock-api/master-data/general/transaction-type/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralTransactionTypeMockApi {
    private _transactionTypes: any[] = transactionTypesData;

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
        // @ transactionTypes - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/transaction-types', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'transactionTypeName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the transactionTypes
                let transactionTypes: any[] | null = cloneDeep(this._transactionTypes);

                // Sort the transactionTypes
                if (
                    sort === 'transactionTypeName' ||
                    sort === 'lastEditedBy' ||
                    sort === 'validFrom' ||
                    sort === 'validTo'
                ) {
                    transactionTypes.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    transactionTypes.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the transactionTypes
                    transactionTypes = transactionTypes.filter(
                        (transactionType) =>
                            transactionType.transactionTypeName &&
                            transactionType.transactionTypeName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const transactionTypesLength = transactionTypes.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), transactionTypesLength);
                const lastPage = Math.max(Math.ceil(transactionTypesLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                if (page > lastPage) {
                    transactionTypes = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    transactionTypes = transactionTypes.slice(begin, end);
                    pagination = {
                        length: transactionTypesLength,
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
                        transactionTypes,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ transactionType - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/transaction-type')
            .reply(({ request }) => {
                const id = request.params.get('id');
                const transactionTypes = cloneDeep(this._transactionTypes);
                const transactionType = transactionTypes.find((item) => item.id === id);
                return [200, transactionType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ transactionType - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/transaction-type')
            .reply(() => {
                const newTransactionType = {
                    id: FuseMockApiUtils.guid(),
                    transactionTypeName: 'New Transaction Type',
                    lastEditedBy: '',
                    validFrom: '',
                    validTo: '',
                };
                this._transactionTypes.unshift(newTransactionType);
                return [200, newTransactionType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ transactionType - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/transaction-type')
            .reply(({ request }) => {
                const id = request.body.id;
                const transactionType = cloneDeep(request.body.transactionType);

                let updatedTransactionType = null;

                this._transactionTypes.forEach((item, index, transactionTypes) => {
                    if (item.id === id) {
                        transactionTypes[index] = assign(
                            {},
                            transactionTypes[index],
                            transactionType
                        );
                        updatedTransactionType = transactionTypes[index];
                    }
                });

                return [200, updatedTransactionType];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ transactionType - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/transaction-type')
            .reply(({ request }) => {
                const id = request.params.get('id');
                this._transactionTypes.forEach((item, index) => {
                    if (item.id === id) {
                        this._transactionTypes.splice(index, 1);
                    }
                });
                return [200, true];
            });
    }
}