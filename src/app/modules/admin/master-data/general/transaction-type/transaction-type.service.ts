import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    TransactionType,
    TransactionTypePagination,
} from 'app/modules/admin/master-data/general/transaction-type/transaction-type.types';
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
export class TransactionTypeService {
    // Private
    private _pagination: BehaviorSubject<TransactionTypePagination | null> =
        new BehaviorSubject(null);
    private _transactionType: BehaviorSubject<TransactionType | null> = new BehaviorSubject(
        null
    );
    private _transactionTypes: BehaviorSubject<TransactionType[] | null> =
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
    get pagination$(): Observable<TransactionTypePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for transactionType
     */
    get transactionType$(): Observable<TransactionType> {
        return this._transactionType.asObservable();
    }

    /**
     * Getter for transactionTypes
     */
    get transactionTypes$(): Observable<TransactionType[]> {
        return this._transactionTypes.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get transactionTypes
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getTransactionTypes(
        page: number = 0,
        size: number = 10,
        sort: string = 'transactionTypeName',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: TransactionTypePagination;
        transactionTypes: TransactionType[];
    }> {
        return this._httpClient
            .get<{
                pagination: TransactionTypePagination;
                transactionTypes: TransactionType[];
            }>('api/master-data/general/transaction-types', {
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
                    this._transactionTypes.next(response.transactionTypes);
                })
            );
    }

    /**
     * Get transactionType by id
     */
    getTransactionTypeById(id: string): Observable<TransactionType> {
        return this._transactionTypes.pipe(
            take(1),
            map((transactionTypes) => {
                // Find the transactionType
                const transactionType =
                    transactionTypes.find((item) => item.id === id) || null;

                // Update the transactionType
                this._transactionType.next(transactionType);

                // Return the transactionType
                return transactionType;
            }),
            switchMap((transactionType) => {
                if (!transactionType) {
                    return throwError(
                        'Could not find transactionType with id of ' + id + '!'
                    );
                }

                return of(transactionType);
            })
        );
    }

    /**
     * Create transactionType
     */
    createTransactionType(): Observable<TransactionType> {
        return this.transactionTypes$.pipe(
            take(1),
            switchMap((transactionTypes) =>
                this._httpClient
                    .post<TransactionType>('api/master-data/general/transaction-type', {})
                    .pipe(
                        map((newTransactionType) => {
                            // Update the transactionTypes with the new transactionType
                            this._transactionTypes.next([newTransactionType, ...transactionTypes]);

                            // Return the new transactionType
                            return newTransactionType;
                        })
                    )
            )
        );
    }

    /**
     * Update transactionType
     *
     * @param id
     * @param transactionType
     */
    updateTransactionType(id: string, transactionType: TransactionType): Observable<TransactionType> {
        return this.transactionTypes$.pipe(
            take(1),
            switchMap((transactionTypes) =>
                this._httpClient
                    .patch<TransactionType>('api/master-data/general/transaction-type', {
                        id,
                        transactionType,
                    })
                    .pipe(
                        map((updatedTransactionType) => {
                            // Find the index of the updated transactionType
                            const index = transactionTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Update the transactionType
                            transactionTypes[index] = updatedTransactionType;

                            // Update the transactionTypes
                            this._transactionTypes.next(transactionTypes);

                            // Return the updated transactionType
                            return updatedTransactionType;
                        }),
                        switchMap((updatedTransactionType) =>
                            this.transactionType$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the transactionType if it's selected
                                    this._transactionType.next(updatedTransactionType);

                                    // Return the updated transactionType
                                    return updatedTransactionType;
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete the transactionType
     *
     * @param id
     */
    deleteTransactionType(id: string): Observable<boolean> {
        return this.transactionTypes$.pipe(
            take(1),
            switchMap((transactionTypes) =>
                this._httpClient
                    .delete('api/master-data/general/transaction-type', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted transactionType
                            const index = transactionTypes.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the transactionType
                            transactionTypes.splice(index, 1);

                            // Update the transactionTypes
                            this._transactionTypes.next(transactionTypes);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}