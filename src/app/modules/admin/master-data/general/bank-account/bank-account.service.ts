import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    BankAccount,
    BankAccountPagination,
} from 'app/modules/admin/master-data/general/bank-account/bank-account.types'; 
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
export class BankAccountService {
    // Private
    private _pagination: BehaviorSubject<BankAccountPagination | null> =
        new BehaviorSubject(null);
    private _bankAccount: BehaviorSubject<BankAccount | null> = new BehaviorSubject(
        null
    );
    private _bankAccounts: BehaviorSubject<BankAccount[] | null> =
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
    get pagination$(): Observable<BankAccountPagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for bankAccount
     */
    get bankAccount$(): Observable<BankAccount> {
        return this._bankAccount.asObservable();
    }

    /**
     * Getter for bankAccounts
     */
    get bankAccounts$(): Observable<BankAccount[]> {
        return this._bankAccounts.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * Get bank accounts
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getBankAccounts(
        page: number = 0,
        size: number = 10,
        sort: string = 'accountName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: BankAccountPagination;
        bankAccounts: BankAccount[];
    }> {
        return this._httpClient
            .get<{
                pagination: BankAccountPagination;
                bankAccounts: BankAccount[];
            }>('api/master-data/general/bank-accounts', {
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
                    console.log('Fetched bank accounts:', response);
                    this._pagination.next(response.pagination);
                    this._bankAccounts.next(response.bankAccounts);
                })
            );
    }

    /**
     * Get bank account by id
     */
    getBankAccountById(id: string): Observable<BankAccount> {
        return this._bankAccounts.pipe(
            take(1),
            map((bankAccounts) => {
                // Find the bank account
                const bankAccount =
                    bankAccounts.find((item) => item.id === id) || null;
                // Update the bank account
                this._bankAccount.next(bankAccount);
                // Return the bank account
                return bankAccount;
            }),
            switchMap((bankAccount) => {
                if (!bankAccount) {
                    return throwError(
                        'Could not found bank account with id of ' + id + '!'
                    );
                }
                return of(bankAccount);
            })
        );
    }

    /**
     * Create bank account
     */
    createBankAccount(): Observable<BankAccount> {
        return this._httpClient
        .post<BankAccount>('api/master-data/general/bank-account', {}) 
        .pipe(
            tap((newBankAccount) => {
                if (!newBankAccount.id) {
                    console.error('Newly created bank account lacks an ID');
                    return;
                }
                const currentBankAccounts = this._bankAccounts.getValue(); 
                this._bankAccounts.next([newBankAccount, ...currentBankAccounts]); 
            })
        );    
    }

    /**
     * Update bank account
     *
     * @param id
     * @param bankAccount
     */
    updateBankAccount(id: string, bankAccount: BankAccount): Observable<BankAccount> {
        console.log('Sending PATCH request:', { id, bankAccount });

        return this._httpClient.patch<BankAccount>(
            'api/master-data/general/bank-account', 
            { id, bankAccount } 
        ).pipe(
            tap((updatedBankAccount) => {
                console.log('PATCH response received:', updatedBankAccount);
                const currentBankAccounts = this._bankAccounts.getValue(); 
                const index = currentBankAccounts.findIndex((account) => account.id === id); // Find the index of the updated bank account
        
                if (index !== -1) {
                    currentBankAccounts[index] = updatedBankAccount; // Update the bank account in the list
                    this._bankAccounts.next(currentBankAccounts); // Emit the updated list
                }
            })
        );        
    }

    /**
     * Delete the bank account
     *
     * @param id
     */
    deleteBankAccount(id: string): Observable<boolean> {
        console.log('Attempting to delete country type with ID:', id);
        return this.bankAccounts$.pipe(
            take(1),
            switchMap((bankAccounts) =>
                this._httpClient
                    .delete('api/master-data/general/bank-account', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted bank account
                            const index = bankAccounts.findIndex(
                                (item) => item.id === id
                            );
                            // Delete the bank account
                            bankAccounts.splice(index, 1);
                            // Update the bank accounts
                            this._bankAccounts.next(bankAccounts);
                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}
