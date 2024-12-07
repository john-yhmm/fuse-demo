import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { bankAccounts as bankAccountsData } from 'app/mock-api/master-data/general/bank-account/data'; 
import { assign, cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class GeneralBankAccountMockApi {
    private _bankAccounts: any[] = bankAccountsData;

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
        // @ Bank Accounts - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/bank-accounts', 300)
            .reply(({ request }) => {
                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'bankAccountName';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the bank accounts
                let bankAccounts: any[] | null = cloneDeep(this._bankAccounts);

                // Sort the bank accounts
                if (
                    sort === 'bankAccountName' ||
                    sort === 'lastEditedBy' ||
                    sort === 'lastEditedOn'
                ) {
                    bankAccounts.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc'
                            ? fieldA.localeCompare(fieldB)
                            : fieldB.localeCompare(fieldA);
                    });
                } else {
                    bankAccounts.sort((a, b) =>
                        order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
                    );
                }

                // If search exists...
                if (search) {
                    // Filter the bank accounts
                    bankAccounts = bankAccounts.filter(
                        (bankAccount) =>
                            bankAccount.bankAccountName &&
                            bankAccount.bankAccountName
                                .toLowerCase()
                                .includes(search.toLowerCase())
                    );
                }

                // Paginate - Start
                const bankAccountsLength = bankAccounts.length;
                // Calculate pagination details
                const begin = page * size;
                const end = Math.min(size * (page + 1), bankAccountsLength);
                const lastPage = Math.max(Math.ceil(bankAccountsLength / size), 1);
                // Prepare the pagination object
                let pagination = {};
                // If the requested page number is bigger than
                // the last possible page number, return null for
                // bank accounts but also send the last possible page so
                // the app can navigate to there
                if (page > lastPage) {
                    bankAccounts = null;
                    pagination = {
                        lastPage,
                    };
                } else {
                    // Paginate the results by size
                    bankAccounts = bankAccounts.slice(begin, end);
                    // Prepare the pagination mock-api
                    pagination = {
                        length: bankAccountsLength,
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
                        bankAccounts,
                        pagination,
                    },
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Bank Account - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/master-data/general/bank-account')
            .reply(({ request }) => {
                // Get the id from the params
                const id = request.params.get('id');
                // Clone the bank accounts
                const bankAccounts = cloneDeep(this._bankAccounts);
                // Find the bank account
                const bankAccount = bankAccounts.find((item) => item.id === id);
                // Return the response
                return [200, bankAccount];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Bank Account - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/master-data/general/bank-account')
            .reply(() => {
                // Generate a new bank account
                const newBankAccount = {
                    id: FuseMockApiUtils.guid(), // Generates a unique ID (UUID)
                    bankAccountName: 'A New Bank Account Name',
                    bankAccountBranch: 'A New Bank Account Branch',
                    bankAccountCode: 'A New Bank Account Code',
                    bankAccountNumber: 'A New Bank Account Number',
                    bankInternationalCode: 'A New Bank International Code',
                    lastEditedBy: 'Admin',
                    validFrom: '',
                    validTo: '',
                };
                // Unshift the new bank account
                this._bankAccounts.unshift(newBankAccount);
                // Return the response
                return [200, newBankAccount];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Bank Account - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/master-data/general/bank-account')
            .reply(({ request }) => {
                // Get the id and bank account data
                const id = request.body.id;
                const bankAccount = cloneDeep(request.body.bankAccount);
                // Prepare the updated bank account
                let updatedBankAccount = null;
                // Find the bank account and update it
                this._bankAccounts.forEach((item, index, bankAccounts) => {
                    if (item.id === id) {
                        // Update the bank account
                        bankAccounts[index] = assign(
                            {},
                            bankAccounts[index],
                            bankAccount
                        );
                        // Store the updated bank account
                        updatedBankAccount = bankAccounts[index];
                    }
                });
                // Return the response
                return [200, updatedBankAccount];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Bank Account - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/master-data/general/bank-account')
            .reply(({ request }) => {
                // Get the id
                const id = request.params.get('id');
                // Find the bank account and delete it
                this._bankAccounts.forEach((item, index) => {
                    if (item.id === id) {
                        this._bankAccounts.splice(index, 1);
                    }
                });
                // Return the response
                return [200, true];
            });
    }
}
