import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
import {
    PaymentAvenue,
    PaymentAvenuePagination,
} from 'app/modules/admin/master-data/general/payment-avenue/payment-avenue.types';

@Injectable({ providedIn: 'root' })
export class PaymentAvenueService {
    // Private
    private _pagination: BehaviorSubject<PaymentAvenuePagination | null> =
        new BehaviorSubject(null);
    private _paymentAvenue: BehaviorSubject<PaymentAvenue | null> =
        new BehaviorSubject(null);
    private _paymentAvenues: BehaviorSubject<PaymentAvenue[] | null> =
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
    get pagination$(): Observable<PaymentAvenuePagination> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for payment avenue
     */
    get paymentAvenue$(): Observable<PaymentAvenue> {
        return this._paymentAvenue.asObservable();
    }

    /**
     * Getter for payment avenues
     */
    get paymentAvenues$(): Observable<PaymentAvenue[]> {
        return this._paymentAvenues.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get payment avenues
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getPaymentAvenues(
        page: number = 0,
        size: number = 10,
        sort: string = 'name',
        order: 'asc' | 'desc' | '' = 'asc',
        search: string = ''
    ): Observable<{
        pagination: PaymentAvenuePagination;
        paymentAvenues: PaymentAvenue[];
    }> {
        return this._httpClient
            .get<{
                pagination: PaymentAvenuePagination;
                paymentAvenues: PaymentAvenue[];
            }>('api/master-data/general/payment-avenues', {
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
                    this._paymentAvenues.next(response.paymentAvenues);
                })
            );
    }

    /**
     * Get payment avenue by id
     */
    getPaymentAvenueById(id: string): Observable<PaymentAvenue> {
        return this._paymentAvenues.pipe(
            take(1),
            map((paymentAvenues) => {
                // Find the payment avenue
                const paymentAvenue =
                    paymentAvenues.find((item) => item.id === id) || null;

                // Update the selected payment avenue
                this._paymentAvenue.next(paymentAvenue);

                // Return the payment avenue
                return paymentAvenue;
            }),
            switchMap((paymentAvenue) => {
                if (!paymentAvenue) {
                    return throwError(
                        'Could not find payment avenue with id of ' + id + '!'
                    );
                }

                return of(paymentAvenue);
            })
        );
    }

    /**
     * Create payment avenue
     */
    createPaymentAvenue(): Observable<PaymentAvenue> {
        return this.paymentAvenues$.pipe(
            take(1),
            switchMap((paymentAvenues) =>
                this._httpClient
                    .post<PaymentAvenue>(
                        'api/master-data/general/payment-avenue',
                        {}
                    )
                    .pipe(
                        map((newPaymentAvenue) => {
                            // Update the list with the new payment avenue
                            this._paymentAvenues.next([
                                newPaymentAvenue,
                                ...paymentAvenues,
                            ]);

                            // Return the new payment avenue
                            return newPaymentAvenue;
                        })
                    )
            )
        );
    }

    /**
     * Update payment avenue
     *
     * @param id
     * @param paymentAvenue
     */
    updatePaymentAvenue(
        id: string,
        paymentAvenue: PaymentAvenue
    ): Observable<PaymentAvenue> {
        return this.paymentAvenues$.pipe(
            take(1),
            switchMap((paymentAvenues) =>
                this._httpClient
                    .patch<PaymentAvenue>(
                        'api/master-data/general/payment-avenue',
                        {
                            id,
                            paymentAvenue,
                        }
                    )
                    .pipe(
                        map((updatedPaymentAvenue) => {
                            // Find the index of the updated payment avenue
                            const index = paymentAvenues.findIndex(
                                (item) => item.id === id
                            );

                            // Update the payment avenue
                            paymentAvenues[index] = updatedPaymentAvenue;

                            // Update the payment avenues
                            this._paymentAvenues.next(paymentAvenues);

                            // Return the updated payment avenue
                            return updatedPaymentAvenue;
                        }),
                        switchMap((updatedPaymentAvenue) =>
                            this.paymentAvenue$.pipe(
                                take(1),
                                filter((item) => item && item.id === id),
                                tap(() => {
                                    // Update the selected payment avenue
                                    this._paymentAvenue.next(
                                        updatedPaymentAvenue
                                    );
                                })
                            )
                        )
                    )
            )
        );
    }

    /**
     * Delete payment avenue
     *
     * @param id
     */
    deletePaymentAvenue(id: string): Observable<boolean> {
        return this.paymentAvenues$.pipe(
            take(1),
            switchMap((paymentAvenues) =>
                this._httpClient
                    .delete('api/master-data/general/payment-avenue', {
                        params: { id },
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted payment avenue
                            const index = paymentAvenues.findIndex(
                                (item) => item.id === id
                            );

                            // Remove the payment avenue
                            paymentAvenues.splice(index, 1);

                            // Update the payment avenues
                            this._paymentAvenues.next(paymentAvenues);

                            // Return the delete status
                            return isDeleted;
                        })
                    )
            )
        );
    }
}